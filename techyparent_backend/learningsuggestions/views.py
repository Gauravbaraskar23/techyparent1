# learningsuggestions/views.py

from rest_framework import generics, views, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Avg, Count
from datetime import timedelta
import random
from .services.ai_engine import AIEngine

from .models import (
    LearningCategory, ChildInterest, LearningResource,
    LearningSuggestion, LearningProgress, DailyLearningGoal,
    ChatSession, ChatMessage, ChatbotPersonality,
    ProblemReport, QuizQuestion, ChildQuizAttempt,
    Achievement, ChildAchievement,
)


# ===========================================================================
# LEARNING SUGGESTIONS VIEWS
# ===========================================================================

class LearningCategoryListView(generics.ListAPIView):
    """List all learning categories"""
    from .serializers import LearningCategorySerializer
    queryset = LearningCategory.objects.all()

    def get_serializer_class(self):
        from .serializers import LearningCategorySerializer
        return LearningCategorySerializer


class ChildInterestView(views.APIView):
    """Get or update child interests"""

    def get(self, request, child_id):
        from .serializers import ChildInterestSerializer
        interests = ChildInterest.objects.filter(child_id=child_id)
        serializer = ChildInterestSerializer(interests, many=True)
        return Response(serializer.data)

    def post(self, request, child_id):
        """Set/update interests for a child"""
        from api.models import Child
        try:
            child = Child.objects.get(id=child_id)
            interests_data = request.data.get('interests', [])

            updated = []
            for item in interests_data:
                category_id = item.get('category_id')
                interest_level = item.get('interest_level', 2)

                interest, created = ChildInterest.objects.update_or_create(
                    child=child,
                    category_id=category_id,
                    defaults={'interest_level': interest_level}
                )
                updated.append(interest.id)

            return Response({
                'success': True,
                'message': f'Updated {len(updated)} interests',
                'updated_count': len(updated)
            })
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class GenerateSuggestionsView(views.APIView):
    """Generate personalized learning suggestions for a child"""

    def get(self, request, child_id):
        from api.models import Child
        from .serializers import LearningSuggestionSerializer

        try:
            child = Child.objects.get(id=child_id)

            # Get child's interests
            interests = ChildInterest.objects.filter(child=child).order_by('-interest_level')

            if not interests.exists():
                # No interests set - suggest from all categories
                resources = LearningResource.objects.filter(is_active=True)[:10]
                self._create_suggestions(child, resources, "Based on popular resources")
            else:
                # Generate based on interests
                for interest in interests:
                    resources = LearningResource.objects.filter(
                        category=interest.category,
                        is_active=True
                    ).exclude(
                        suggestions__child=child,
                        suggestions__status__in=['completed', 'skipped']
                    )[:5]

                    reason = f"Because you're interested in {interest.category.display_name}"
                    self._create_suggestions(child, resources, reason, interest.interest_level)

            # Return suggestions
            suggestions = LearningSuggestion.objects.filter(
                child=child,
                status='pending'
            ).select_related('resource', 'category')[:10]

            from .serializers import LearningSuggestionSerializer
            serializer = LearningSuggestionSerializer(suggestions, many=True)

            return Response({
                'suggestions': serializer.data,
                'total': len(serializer.data),
                'child_name': child.name
            })

        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def _create_suggestions(self, child, resources, reason, interest_level=2):
        relevance_score = interest_level / 3.0  # Convert 1-3 to 0-1

        for resource in resources:
            LearningSuggestion.objects.get_or_create(
                child=child,
                resource=resource,
                defaults={
                    'category': resource.category,
                    'reason': reason,
                    'relevance_score': relevance_score,
                    'status': 'pending'
                }
            )


class SuggestionActionView(views.APIView):
    """Accept, complete, or skip a suggestion"""

    def post(self, request, suggestion_id):
        action = request.data.get('action')  # accept, complete, skip
        rating = request.data.get('rating')
        feedback = request.data.get('feedback', '')

        try:
            suggestion = LearningSuggestion.objects.get(id=suggestion_id)

            if action == 'accept':
                suggestion.mark_accepted()
                message = f"Great choice! Enjoy {suggestion.resource.title}!"

            elif action == 'complete':
                suggestion.mark_completed(rating=rating, feedback=feedback)
                message = f"Amazing! You completed {suggestion.resource.title}! ⭐"

                # Update learning progress
                self._update_progress(suggestion)

                # Check achievements
                self._check_achievements(suggestion.child)

            elif action == 'skip':
                suggestion.status = 'skipped'
                suggestion.save()
                message = "Okay, we'll suggest something else next time!"

            else:
                return Response({'error': 'Invalid action'}, status=400)

            return Response({
                'success': True,
                'message': message,
                'status': suggestion.status
            })

        except LearningSuggestion.DoesNotExist:
            return Response({'error': 'Suggestion not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def _update_progress(self, suggestion):
        progress, created = LearningProgress.objects.get_or_create(
            child=suggestion.child,
            category=suggestion.category
        )
        progress.resources_completed += 1
        if suggestion.resource.duration_minutes:
            progress.total_time_minutes += suggestion.resource.duration_minutes
        if suggestion.rating:
            all_ratings = LearningSuggestion.objects.filter(
                child=suggestion.child,
                category=suggestion.category,
                rating__isnull=False
            ).aggregate(avg=Avg('rating'))
            progress.avg_rating = all_ratings['avg'] or 0
        progress.last_activity_date = timezone.now().date()
        progress.save()

    def _check_achievements(self, child):
        # Check completion achievements
        total_completed = LearningSuggestion.objects.filter(
            child=child, status='completed'
        ).count()

        milestones = [1, 5, 10, 25, 50]
        for milestone in milestones:
            if total_completed == milestone:
                achievement = Achievement.objects.filter(
                    achievement_type='completion',
                    requirement_value=milestone
                ).first()
                if achievement:
                    ChildAchievement.objects.get_or_create(
                        child=child,
                        achievement=achievement,
                        defaults={'points_earned': achievement.points}
                    )


class LearningDashboardView(views.APIView):
    """Full dashboard data for learning module"""

    def get(self, request, child_id):
        from api.models import Child
        try:
            child = Child.objects.get(id=child_id)
            today = timezone.now().date()

            # Today's goal
            goal, _ = DailyLearningGoal.objects.get_or_create(
                child=child,
                date=today,
                defaults={'target_minutes': 30, 'resources_target': 2}
            )

            # Pending suggestions
            suggestions = LearningSuggestion.objects.filter(
                child=child, status='pending'
            ).select_related('resource', 'category')[:5]

            # Recent completions
            recent = LearningSuggestion.objects.filter(
                child=child, status='completed'
            ).order_by('-completed_at')[:3]

            # Progress per category
            progress = LearningProgress.objects.filter(child=child)

            # Achievements
            achievements = ChildAchievement.objects.filter(child=child).select_related('achievement')

            # Streak
            streak = self._calculate_streak(child)

            from .serializers import (
                LearningSuggestionSerializer, LearningProgressSerializer,
                ChildAchievementSerializer, DailyLearningGoalSerializer
            )

            return Response({
                'child_name': child.name,
                'today_goal': DailyLearningGoalSerializer(goal).data,
                'streak_days': streak,
                'total_completed': LearningSuggestion.objects.filter(child=child, status='completed').count(),
                'total_achievements': achievements.count(),
                'pending_suggestions': LearningSuggestionSerializer(suggestions, many=True).data,
                'recent_completions': LearningSuggestionSerializer(recent, many=True).data,
                'category_progress': LearningProgressSerializer(progress, many=True).data,
                'achievements': ChildAchievementSerializer(achievements, many=True).data,
            })

        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def _calculate_streak(self, child):
        streak = 0
        date = timezone.now().date()
        while True:
            goal = DailyLearningGoal.objects.filter(child=child, date=date, is_achieved=True).first()
            if goal:
                streak += 1
                date -= timedelta(days=1)
            else:
                break
        return streak


# ===========================================================================
# CHATBOT VIEWS
# ===========================================================================

class StartChatSessionView(views.APIView):
    """Start a new chat session"""

    def post(self, request):
        from api.models import Child
        child_id = request.data.get('child_id')
        mood = request.data.get('mood', '')

        try:
            child = Child.objects.get(id=child_id)

            # Close any existing active session
            ChatSession.objects.filter(child=child, is_active=True).update(
                is_active=False,
                ended_at=timezone.now()
            )

            # Create new session
            session = ChatSession.objects.create(
                child=child,
                mood_start=mood,
                title=f"Chat on {timezone.now().strftime('%b %d, %Y')}"
            )

            # Get chatbot personality
            personality, _ = ChatbotPersonality.objects.get_or_create(
                child=child,
                defaults={'bot_name': 'Techy', 'personality_type': 'friendly'}
            )

            # Send welcome message
            welcome = self._get_welcome_message(child, personality, mood)
            ChatMessage.objects.create(
                session=session,
                sender='assistant',
                content=welcome,
                message_type='text'
            )

            return Response({
                'success': True,
                'session_id': session.id,
                'bot_name': personality.bot_name,
                'welcome_message': welcome,
                'personality': personality.personality_type
            })

        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def _get_welcome_message(self, child, personality, mood):
        name = child.name
        bot = personality.bot_name

        mood_responses = {
            'happy': f"Hi {name}! You seem happy today! 😊 That's wonderful! What would you like to learn or talk about?",
            'sad': f"Hi {name} 💙 I noticed you might be feeling sad. I'm here for you! Would you like to talk about it, or should we do something fun together?",
            'confused': f"Hey {name}! 🤔 Confused about something? Don't worry - that's how we learn! Tell me what's puzzling you and we'll figure it out together!",
            'excited': f"Hi {name}! 🎉 Your excitement is contagious! What are you so excited about? Let's channel that energy into something amazing!",
            'frustrated': f"Hey {name} 😤 Feeling frustrated? That's totally okay! Take a deep breath with me... 💨 Now, tell me what's going on - I'm here to help!",
            'bored': f"Hi {name}! 😴 Feeling bored? I have so many fun things for us to do! Want to play a quiz, explore something new, or just chat?",
        }

        if mood in mood_responses:
            return mood_responses[mood]

        return f"Hi {name}! 👋 I'm {bot}, your learning assistant! I'm here to help you learn new things, solve problems, and have fun. What's on your mind today?"


class SendMessageView(views.APIView):
    """Send a message to the chatbot and get response"""

    # Predefined responses - in production replace with actual AI API call
    PROBLEM_KEYWORDS = {
        'bullying': ['bully', 'bullied', 'hitting', 'mean', 'making fun', 'laughing at me'],
        'homework': ['homework', 'assignment', "don't understand", 'hard', 'difficult', 'confused about', 'help with'],
        'friendship': ['friend', 'lonely', 'no friends', 'fight with', 'argument', 'ignore me'],
        'emotion': ['sad', 'angry', 'scared', 'worried', 'anxious', 'afraid', 'depressed', 'upset'],
    }

    def post(self, request):
        session_id = request.data.get('session_id')
        child_message = request.data.get('message', '').strip()

        if not child_message:
            return Response({'error': 'Message cannot be empty'}, status=400)

        try:
            session = ChatSession.objects.get(id=session_id, is_active=True)
            child = session.child

            # Save child message
            child_msg = ChatMessage.objects.create(
                session=session,
                sender='child',
                content=child_message,
                message_type='text'
            )

            # Update message count
            session.message_count += 1
            session.save()

            # Detect problem category
            problem_category = self._detect_problem(child_message)

            # Generate AI response
            response_data = self._generate_response(child, session, child_message, problem_category)

            # Save assistant response
            assistant_msg = ChatMessage.objects.create(
                session=session,
                sender='assistant',
                content=response_data['message'],
                message_type=response_data.get('type', 'text'),
                metadata=response_data.get('metadata', {})
            )

            # Handle problem report if detected
            if problem_category and response_data.get('is_problem'):
                self._create_problem_report(child, session, child_message, problem_category, response_data['message'])

            # Check if we should suggest a quiz
            should_quiz = self._should_suggest_quiz(session)

            return Response({
                'success': True,
                'response': response_data['message'],
                'message_type': response_data.get('type', 'text'),
                'metadata': response_data.get('metadata', {}),
                'should_quiz': should_quiz,
                'message_id': assistant_msg.id,
                'problem_detected': bool(problem_category),
                'problem_category': problem_category
            })

        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found or expired'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def _detect_problem(self, message):
        message_lower = message.lower()
        for category, keywords in self.PROBLEM_KEYWORDS.items():
            if any(keyword in message_lower for keyword in keywords):
                return category
        return None

    def _generate_response(self, child, session, message, problem_category):
        message_lower = message.lower()

        # ✅ QUIZ TRIGGER (ADD THIS)
        if "quiz" in message_lower:
            return {
                "message": "Let's play a quiz! 🎯",
                "type": "quiz",
                "metadata": {
                    "quiz_api": f"/api/learningsuggestions/quiz/{child.id}/"
                },
                "is_problem": False
            }

        history = session.messages.order_by('-created_at')[:10]

        # 1. Let AI generate base response
        ai_reply = AIEngine.generate_reply(child, session, message, history)

        # 2. Safety layer (your existing detection)
        if problem_category == 'bullying':
            return {
                'message': ai_reply + "\n\n💙 I’m also informing a trusted adult for your safety.",
                'type': 'encouragement',
                'is_problem': True
            }

        # 3. Enhance with learning suggestions
        if "learn" in message.lower():
            ai_reply += "\n\n📚 Want me to suggest a learning activity?"

        return {
            'message': ai_reply,
            'type': 'text',
            'is_problem': False
        }
    # def _generate_response(self, child, session, message, problem_category):
    #     """Generate contextual AI response"""
    #     message_lower = message.lower()

    #     # Homework help
    #     if problem_category == 'homework' or any(w in message_lower for w in ['help', 'explain', 'how to', 'what is']):
    #         return {
    #             'message': f"Of course I can help! 📚 Let's break this down step by step. What exactly are you working on? Share the question or topic, and we'll solve it together!",
    #             'type': 'text',
    #             'is_problem': False
    #         }

    #     # Bullying
    #     if problem_category == 'bullying':
    #         return {
    #             'message': "I'm really sorry to hear that 💙 No one deserves to be treated that way. You're brave for telling me! Here's what I think you should do:\n\n1. Tell a trusted adult (parent, teacher)\n2. Stay with friends when possible\n3. Walk away calmly\n4. Remember - this is NOT your fault!\n\nI'm going to let your parent know so they can help you. You're not alone! 🤗",
    #             'type': 'encouragement',
    #             'is_problem': True
    #         }

    #     # Sadness/emotion
    #     if problem_category == 'emotion':
    #         return {
    #             'message': "I hear you, and your feelings are completely valid 💙 It's okay to feel this way sometimes. Want to try something? Take 3 deep breaths with me:\n\n🌬️ Breathe in... hold... breathe out...\n\nDo you want to talk more about what's making you feel this way? I'm here to listen without judgment.",
    #             'type': 'encouragement',
    #             'is_problem': True
    #         }

    #     # Friendship
    #     if problem_category == 'friendship':
    #         return {
    #             'message': "Friendship problems can feel really hard 💔 But you're not alone! Making and keeping friends takes practice. Here are some tips:\n\n⭐ Be kind and show genuine interest\n⭐ Find people with similar interests\n⭐ Be a good listener\n⭐ Don't be afraid to say sorry when wrong\n\nWould you like to tell me more about what happened?",
    #             'type': 'text',
    #             'is_problem': True
    #         }

    #     # Quiz request
    #     if any(w in message_lower for w in ['quiz', 'test', 'question', 'challenge']):
    #         return {
    #             'message': "Ooh a quiz! I love quizzes! 🎯 Which subject would you like to be quizzed on?\n\n📐 Math\n🔬 Science\n📖 Language\n🌍 General Knowledge",
    #             'type': 'quiz',
    #             'is_problem': False,
    #             'metadata': {'expecting_quiz_category': True}
    #         }

    #     # Learning question
    #     if any(w in message_lower for w in ['learn', 'tell me about', 'what is', 'how does', 'why']):
    #         # Extract the topic
    #         topic = message.replace('tell me about', '').replace('what is', '').replace('how does', '').replace('why', '').strip()
    #         return {
    #             'message': f"Great question about {topic}! 🌟 Let me share what I know...\n\nI'd love to give you a detailed explanation! This is exactly the kind of curiosity that makes great learners. Would you like me to also suggest some fun resources where you can explore this topic more? 📚",
    #             'type': 'text',
    #             'is_problem': False
    #         }

    #     # Bored
    #     if any(w in message_lower for w in ['bored', 'nothing to do', 'boring']):
    #         return {
    #             'message': "Boredom = opportunity for something awesome! 🎉 Here's what we can do:\n\n🎯 Take a fun quiz\n📚 Explore a new topic\n🎨 Creative challenge\n🧩 Brain teaser\n\nWhat sounds most fun to you?",
    #             'type': 'text',
    #             'is_problem': False
    #         }

    #     # Default encouraging response
    #     encouragements = [
    #         f"That's really interesting, {child.name}! Tell me more! 😊",
    #         f"Great thought! 🌟 I love how curious you are!",
    #         f"You're asking exactly the right questions! Let's explore that together! 🔍",
    #         f"Awesome! 🎉 Keep that curiosity going - it's your superpower!",
    #     ]

    #     return {
    #         'message': random.choice(encouragements),
    #         'type': 'text',
    #         'is_problem': False
    #     }

    def _create_problem_report(self, child, session, message, category, ai_response):
        severity_map = {
            'bullying': 'high',
            'emotion': 'medium',
            'friendship': 'low',
            'homework': 'low',
        }

        ProblemReport.objects.create(
            child=child,
            session=session,
            category=category,
            severity=severity_map.get(category, 'low'),
            description=message,
            ai_response=ai_response,
            parent_notified=category in ['bullying', 'emotion']
        )

    def _should_suggest_quiz(self, session):
        # Suggest a quiz every 5 messages
        return session.message_count > 0 and session.message_count % 5 == 0


class GetChatHistoryView(views.APIView):
    """Get chat history for a session"""

    def get(self, request, session_id):
        from .serializers import ChatMessageSerializer
        try:
            session = ChatSession.objects.get(id=session_id)
            messages = session.messages.all()
            serializer = ChatMessageSerializer(messages, many=True)
            return Response({
                'session_id': session_id,
                'messages': serializer.data,
                'child_name': session.child.name
            })
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)


class EndChatSessionView(views.APIView):
    """End a chat session"""

    def post(self, request, session_id):
        mood_end = request.data.get('mood_end', '')
        try:
            session = ChatSession.objects.get(id=session_id, is_active=True)
            session.end_session(mood_end=mood_end)

            # Generate goodbye message
            goodbye = "Thanks for chatting with me today! 🌟 Remember, every day is a new chance to learn something amazing. See you soon! 👋😊"

            return Response({
                'success': True,
                'message': goodbye,
                'session_summary': {
                    'message_count': session.message_count,
                    'duration_minutes': int((session.ended_at - session.started_at).total_seconds() / 60)
                }
            })
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)


class QuizView(views.APIView):
    """Get quiz questions and submit answers"""

    def get(self, request, child_id):
        """Get a quiz question"""
        from api.models import Child
        from .serializers import QuizQuestionSerializer
        category_name = request.query_params.get('category')
        difficulty = request.query_params.get('difficulty', 'easy')
        # questions = QuizQuestion.objects.filter(level=difficulty)
        # questions = random.sample(list(questions), min(5, len(questions)))
        try:
            child = Child.objects.get(id=child_id)

            # Get answered questions to avoid repetition
            answered_ids = ChildQuizAttempt.objects.filter(
                child=child
            ).values_list('question_id', flat=True)

            questions = QuizQuestion.objects.filter(
                is_active=True,
                difficulty=difficulty
            ).exclude(id__in=answered_ids)

            if category_name:
                questions = questions.filter(category__name=category_name)

            question = questions.order_by('?').first()

            if not question:
                # Reset and get any question
                question = QuizQuestion.objects.filter(is_active=True).order_by('?').first()

            if not question:
                return Response({'message': 'No questions available'}, status=404)

            serializer = QuizQuestionSerializer(question)
            return Response(serializer.data)

        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)

    def post(self, request, child_id):
        """Submit a quiz answer"""
        from api.models import Child
        question_id = request.data.get('question_id')
        selected_answer = request.data.get('answer')
        session_id = request.data.get('session_id')
        time_taken = request.data.get('time_taken', 0)

        try:
            child = Child.objects.get(id=child_id)
            question = QuizQuestion.objects.get(id=question_id)

            is_correct = selected_answer.lower() == question.correct_answer.lower()

            attempt = ChildQuizAttempt.objects.create(
                child=child,
                question=question,
                session_id=session_id,
                selected_answer=selected_answer,
                is_correct=is_correct,
                time_taken_seconds=time_taken
            )

            if is_correct:
                message = f"🎉 Correct! {question.explanation}"
                emoji = "🌟"
            else:
                correct_option = getattr(question, f'option_{question.correct_answer}')
                message = f"Not quite! The correct answer was: {correct_option}\n\n💡 {question.explanation}"
                emoji = "💪"

            return Response({
                'is_correct': is_correct,
                'correct_answer': question.correct_answer,
                'explanation': question.explanation,
                'message': message,
                'emoji': emoji,
                'points': 10 if is_correct else 2
            })

        except (Child.DoesNotExist, QuizQuestion.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)


class AchievementsView(views.APIView):
    """Get child achievements"""

    def get(self, request, child_id):
        from .serializers import ChildAchievementSerializer, AchievementSerializer
        earned = ChildAchievement.objects.filter(child_id=child_id).select_related('achievement')
        all_achievements = Achievement.objects.filter(is_active=True)

        earned_ids = earned.values_list('achievement_id', flat=True)

        return Response({
            'earned': ChildAchievementSerializer(earned, many=True).data,
            'available': AchievementSerializer(
                all_achievements.exclude(id__in=earned_ids), many=True
            ).data,
            'total_points': sum(a.points_earned for a in earned),
            'total_earned': earned.count(),
            'total_available': all_achievements.count()
        })


class ParentProblemReportsView(views.APIView):
    """Parent can view problem reports from chatbot"""

    def get(self, request, child_id):
        from .serializers import ProblemReportSerializer
        reports = ProblemReport.objects.filter(
            child_id=child_id
        ).order_by('-created_at')

        unresolved = reports.filter(is_resolved=False)

        return Response({
            'reports': ProblemReportSerializer(reports, many=True).data,
            'unresolved_count': unresolved.count(),
            'high_severity_count': unresolved.filter(severity='high').count()
        })

    def patch(self, request, child_id):
        """Mark a report as resolved"""
        report_id = request.data.get('report_id')
        try:
            report = ProblemReport.objects.get(id=report_id, child_id=child_id)
            report.resolve()
            return Response({'success': True, 'message': 'Report marked as resolved'})
        except ProblemReport.DoesNotExist:
            return Response({'error': 'Report not found'}, status=404)


class ChatbotPersonalityView(views.APIView):
    """Get or update chatbot personality settings"""

    def get(self, request, child_id):
        from .serializers import ChatbotPersonalitySerializer
        from api.models import Child
        try:
            child = Child.objects.get(id=child_id)
            personality, _ = ChatbotPersonality.objects.get_or_create(
                child=child,
                defaults={'bot_name': 'Techy', 'personality_type': 'friendly'}
            )
            from .serializers import ChatbotPersonalitySerializer
            return Response(ChatbotPersonalitySerializer(personality).data)
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)

    def post(self, request, child_id):
        from api.models import Child
        try:
            child = Child.objects.get(id=child_id)
            personality, _ = ChatbotPersonality.objects.get_or_create(child=child)

            for key, value in request.data.items():
                if hasattr(personality, key):
                    setattr(personality, key, value)
            personality.save()

            return Response({'success': True, 'message': 'Personality updated!'})
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)