
from rest_framework import generics, views, status
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
import re

from .models import (
    RoutineCategory, DailyRoutine, RoutineActivity,
    RoutineCompletion, RoutineTemplate,
    # Voice models (added after voice integration)
    VoiceCommand, VoiceSettings, ActivityPhrase, VoiceNotification,
)
from .serializers import (
    RoutineCategorySerializer, DailyRoutineSerializer,
    RoutineActivitySerializer, RoutineCompletionSerializer,
    DailyRoutineSummarySerializer, RoutineTemplateSerializer,
    CreateRoutineFromTemplateSerializer, BulkActivityUpdateSerializer
)


# ===========================================================================
# ✅ ORIGINAL VIEWS (unchanged from dailyroutine_views.py)
# ===========================================================================

class RoutineCategoryListView(generics.ListAPIView):
    """List all routine categories"""
    queryset = RoutineCategory.objects.all()
    serializer_class = RoutineCategorySerializer


class DailyRoutineListCreateView(generics.ListCreateAPIView):
    """List or create daily routines for a child"""
    serializer_class = DailyRoutineSerializer

    def get_queryset(self):
        child_id = self.request.query_params.get('child_id')
        if child_id:
            return DailyRoutine.objects.filter(child_id=child_id)
        return DailyRoutine.objects.all()


class DailyRoutineDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific routine"""
    queryset = DailyRoutine.objects.all()
    serializer_class = DailyRoutineSerializer


class DailyRoutineSummaryView(views.APIView):
    """Get routine summary for dashboard widget"""

    def get(self, request, child_id):
        try:
            routine = DailyRoutine.objects.filter(
                child_id=child_id,
                is_active=True
            ).first()

            if not routine:
                return Response({
                    'has_routine': False,
                    'message': 'No active routine found'
                })

            serializer = DailyRoutineSummarySerializer(routine)
            data = serializer.data
            data['has_routine'] = True

            return Response(data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TodayActivitiesView(views.APIView):
    """Get today's activities with completion status"""

    def get(self, request, child_id):
        try:
            routine = DailyRoutine.objects.filter(
                child_id=child_id,
                is_active=True
            ).first()

            if not routine:
                return Response({
                    'activities': [],
                    'message': 'No active routine found'
                })

            activities = []

            for activity in routine.activities.filter(is_active=True):
                if activity.is_for_today():
                    activity_data = RoutineActivitySerializer(activity).data
                    activities.append(activity_data)

            activities.sort(key=lambda x: x['scheduled_time'])

            return Response({
                'date': timezone.now().date(),
                'day': timezone.now().strftime('%A'),
                'routine_id': routine.id,
                'routine_title': routine.title,
                'activities': activities,
                'total': len(activities),
                'completed': routine.get_completed_today(),
                'completion_percentage': routine.get_completion_percentage_today()
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RoutineActivityCreateView(generics.CreateAPIView):
    """Create a new activity"""
    queryset = RoutineActivity.objects.all()
    serializer_class = RoutineActivitySerializer


class RoutineActivityUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Update or delete an activity"""
    queryset = RoutineActivity.objects.all()
    serializer_class = RoutineActivitySerializer


class ToggleActivityCompletionView(views.APIView):
    """Toggle activity completion status"""

    def post(self, request, activity_id):
        try:
            activity = RoutineActivity.objects.get(id=activity_id)
            today = timezone.now().date()

            completion, created = RoutineCompletion.objects.get_or_create(
                activity=activity,
                date=today
            )

            if completion.is_completed:
                completion.mark_incomplete()
                message = f"{activity.title} marked as incomplete"
            else:
                completion.mark_complete()
                message = f"{activity.title} marked as complete"

            serializer = RoutineCompletionSerializer(completion)

            return Response({
                'success': True,
                'message': message,
                'completion': serializer.data
            })
        except RoutineActivity.DoesNotExist:
            return Response(
                {'error': 'Activity not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkUpdateCompletionsView(views.APIView):
    """Bulk update multiple activities"""

    def post(self, request):
        serializer = BulkActivityUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        activity_ids = serializer.validated_data['activity_ids']
        is_completed = serializer.validated_data['is_completed']
        date = serializer.validated_data.get('date', timezone.now().date())

        updated_count = 0

        for activity_id in activity_ids:
            try:
                activity = RoutineActivity.objects.get(id=activity_id)
                completion, created = RoutineCompletion.objects.get_or_create(
                    activity=activity,
                    date=date
                )

                if is_completed:
                    completion.mark_complete()
                else:
                    completion.mark_incomplete()

                updated_count += 1
            except RoutineActivity.DoesNotExist:
                continue

        return Response({
            'success': True,
            'updated_count': updated_count,
            'message': f'Updated {updated_count} activities'
        })


class RoutineStatsView(views.APIView):
    """Get routine statistics"""

    def get(self, request, child_id):
        try:
            routine = DailyRoutine.objects.filter(
                child_id=child_id,
                is_active=True
            ).first()

            if not routine:
                return Response({'error': 'No active routine found'})

            stats = []
            for i in range(7):
                date = timezone.now().date() - timedelta(days=i)

                completions = RoutineCompletion.objects.filter(
                    activity__routine=routine,
                    date=date,
                    is_completed=True
                ).count()

                total = routine.activities.filter(is_active=True).count()
                percentage = int((completions / total * 100)) if total > 0 else 0

                stats.append({
                    'date': date,
                    'day': date.strftime('%A'),
                    'completed': completions,
                    'total': total,
                    'percentage': percentage
                })

            streak = 0
            for day in stats:
                if day['percentage'] >= 80:
                    streak += 1
                else:
                    break

            return Response({
                'routine_id': routine.id,
                'daily_stats': stats,
                'current_streak': streak,
                'total_activities': routine.get_total_activities(),
                'avg_completion': sum(s['percentage'] for s in stats) // len(stats)
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RoutineTemplateListView(generics.ListAPIView):
    """List available routine templates"""
    queryset = RoutineTemplate.objects.filter(is_public=True)
    serializer_class = RoutineTemplateSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        age_group = self.request.query_params.get('age_group')
        if age_group:
            queryset = queryset.filter(age_group=age_group)
        return queryset


class CreateRoutineFromTemplateView(views.APIView):
    """Create a routine from a template"""

    def post(self, request):
        serializer = CreateRoutineFromTemplateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        child_id = serializer.validated_data['child_id']
        template_id = serializer.validated_data['template_id']

        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)
            template = RoutineTemplate.objects.get(id=template_id)

            routine = DailyRoutine.objects.create(
                child=child,
                title=template.name
            )

            for activity_data in template.activities_data:
                category = None
                if 'category' in activity_data:
                    category = RoutineCategory.objects.filter(
                        name=activity_data['category']
                    ).first()

                RoutineActivity.objects.create(
                    routine=routine,
                    category=category,
                    title=activity_data['title'],
                    description=activity_data.get('description', ''),
                    scheduled_time=activity_data['time'],
                    duration_minutes=activity_data.get('duration', 15),
                    icon_name=activity_data.get('icon', 'time-outline'),
                    color=activity_data.get('color', '#3b82f6'),
                    order=activity_data.get('order', 0)
                )

            serializer = DailyRoutineSerializer(routine)

            return Response({
                'success': True,
                'message': f'Created routine from template: {template.name}',
                'routine': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReorderActivitiesView(views.APIView):
    """Reorder activities in a routine"""

    def post(self, request, routine_id):
        try:
            routine = DailyRoutine.objects.get(id=routine_id)
            activity_orders = request.data.get('activities', [])

            for item in activity_orders:
                activity_id = item['id']
                new_order = item['order']

                RoutineActivity.objects.filter(
                    id=activity_id,
                    routine=routine
                ).update(order=new_order)

            return Response({
                'success': True,
                'message': 'Activities reordered successfully'
            })
        except DailyRoutine.DoesNotExist:
            return Response(
                {'error': 'Routine not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ===========================================================================
# ✅ VOICE INTEGRATION VIEWS (added - from voice_integration_views.py)
# ===========================================================================

class ProcessVoiceCommandView(views.APIView):
    """
    Process voice command from child
    Endpoint: POST /api/dailyroutine/voice/command/
    """

    def post(self, request):
        child_id = request.data.get('child_id')
        spoken_text = request.data.get('spoken_text', '').lower()
        confidence = request.data.get('confidence', 0.0)

        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)

            settings, _ = VoiceSettings.objects.get_or_create(child=child)

            if not settings.enable_voice_commands:
                return Response({
                    'success': False,
                    'message': 'Voice commands are disabled'
                })

            # Check for wake word if required
            if settings.require_wake_word:
                if settings.wake_word.lower() not in spoken_text:
                    return Response({
                        'success': False,
                        'message': 'Wake word not detected',
                        'wake_word': settings.wake_word
                    })
                spoken_text = spoken_text.replace(settings.wake_word.lower(), '').strip()

            result = self._analyze_command(child, spoken_text, confidence)

            voice_command = VoiceCommand.objects.create(
                child=child,
                activity=result.get('activity'),
                command_type=result.get('command_type', 'query'),
                spoken_text=spoken_text,
                interpreted_action=result.get('action', 'Unknown'),
                confidence_score=confidence,
                was_successful=result.get('success', False),
                response_text=result.get('response_text', '')
            )

            if result.get('success'):
                self._execute_action(result, voice_command)

            return Response({
                'success': result.get('success', False),
                'command_type': result.get('command_type'),
                'activity': result.get('activity_name'),
                'action_taken': result.get('action'),
                'response_text': result.get('response_text'),
                'speak_response': True,
                'voice_settings': {
                    'voice_type': settings.voice_type,
                    'language': settings.language,
                    'speech_rate': settings.speech_rate,
                    'pitch': settings.pitch,
                }
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _analyze_command(self, child, spoken_text, confidence):
        routine = DailyRoutine.objects.filter(child=child, is_active=True).first()
        if not routine:
            return {
                'success': False,
                'response_text': "You don't have an active routine yet. Ask your parent to set one up!"
            }

        completion_patterns = [
            r"(i'?m? done|finished|completed|i did it)",
            r"(done with|finished with|completed) (.+)",
            r"mark (.+) (as )?(done|complete)",
        ]
        query_patterns = [
            r"what'?s? next",
            r"what (do|should) i (do|have) next",
            r"what'?s? (my|the) next (activity|task)",
        ]
        status_patterns = [
            r"(what|how) (is|'?s) my (progress|status)",
            r"how (am|did) i (do|doing)",
            r"show (me )?(my )?(progress|routine)",
        ]
        skip_patterns = [
            r"skip (this|current|next)",
            r"i (can'?t|cannot|won'?t) do (.+)",
        ]

        for pattern in completion_patterns:
            match = re.search(pattern, spoken_text)
            if match:
                return self._handle_completion(child, routine, spoken_text, match)

        for pattern in query_patterns:
            if re.search(pattern, spoken_text):
                return self._handle_next_query(routine)

        for pattern in status_patterns:
            if re.search(pattern, spoken_text):
                return self._handle_status_query(routine)

        for pattern in skip_patterns:
            if re.search(pattern, spoken_text):
                return self._handle_skip(routine)

        return {
            'success': False,
            'command_type': 'help',
            'response_text': "I didn't quite understand that. Try saying 'I'm done', 'What's next?', or 'Show my progress'"
        }

    def _handle_completion(self, child, routine, spoken_text, match):
        now = timezone.now().time()

        activities = routine.activities.filter(
            is_active=True,
            scheduled_time__lte=now
        ).order_by('-scheduled_time')[:3]

        activity = None

        for act in activities:
            if act.title.lower() in spoken_text:
                activity = act
                break

        if not activity:
            for act in activities:
                if not act.is_completed_today():
                    activity = act
                    break

        if not activity:
            return {
                'success': False,
                'command_type': 'completion',
                'response_text': "I couldn't find an activity to mark as done. Can you be more specific?"
            }

        return {
            'success': True,
            'command_type': 'completion',
            'activity': activity,
            'activity_name': activity.title,
            'action': f'Mark {activity.title} as complete',
            'response_text': f"Great job! I've marked '{activity.title}' as complete! ⭐"
        }

    def _handle_next_query(self, routine):
        now = timezone.now().time()

        next_activities = routine.activities.filter(
            is_active=True,
            scheduled_time__gt=now
        ).order_by('scheduled_time')

        next_act = None
        for act in next_activities:
            if act.is_for_today() and not act.is_completed_today():
                next_act = act
                break

        if not next_act:
            return {
                'success': True,
                'command_type': 'query',
                'response_text': "You're all done for today! Great work! 🎉"
            }

        time_until = self._calculate_time_until(next_act.scheduled_time)

        return {
            'success': True,
            'command_type': 'query',
            'activity': next_act,
            'activity_name': next_act.title,
            'action': 'Query next activity',
            'response_text': f"Next up is {next_act.title} at {next_act.scheduled_time.strftime('%I:%M %p')}. That's in {time_until}!"
        }

    def _handle_status_query(self, routine):
        total = routine.get_total_activities()
        completed = routine.get_completed_today()
        percentage = routine.get_completion_percentage_today()
        remaining = total - completed

        if percentage == 100:
            response = f"Amazing! You've completed all {total} activities today! 🌟"
        elif percentage >= 75:
            response = f"You're doing great! {completed} out of {total} done. Just {remaining} more to go!"
        elif percentage >= 50:
            response = f"Good progress! You've finished {completed} activities. {remaining} left!"
        else:
            response = f"You've completed {completed} out of {total} activities. Keep going!"

        return {
            'success': True,
            'command_type': 'query',
            'action': 'Status query',
            'response_text': response,
        }

    def _handle_skip(self, routine):
        return {
            'success': False,
            'command_type': 'skip',
            'response_text': "To skip an activity, please ask your parent for permission first."
        }

    def _calculate_time_until(self, scheduled_time):
        now = timezone.now()
        scheduled = datetime.combine(now.date(), scheduled_time)

        if scheduled < now:
            scheduled += timedelta(days=1)

        diff = scheduled - now
        minutes = int(diff.total_seconds() / 60)

        if minutes < 60:
            return f"{minutes} minutes"
        else:
            hours = minutes // 60
            mins = minutes % 60
            if mins > 0:
                return f"{hours} hour{'s' if hours > 1 else ''} and {mins} minutes"
            return f"{hours} hour{'s' if hours > 1 else ''}"

    def _execute_action(self, result, voice_command):
        if result.get('command_type') == 'completion' and result.get('activity'):
            activity = result['activity']
            today = timezone.now().date()

            completion, created = RoutineCompletion.objects.get_or_create(
                activity=activity,
                date=today
            )

            completion.mark_complete(via_voice=True, voice_command=voice_command)


class GetActivityReminderView(views.APIView):
    """Get reminder text for upcoming activity"""

    def get(self, request, child_id):
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)

            settings, _ = VoiceSettings.objects.get_or_create(child=child)
            routine = DailyRoutine.objects.filter(child=child, is_active=True).first()

            if not routine or not settings.speak_reminders:
                return Response({'reminders': []})

            now = timezone.now()
            reminders = []

            for activity in routine.activities.filter(is_active=True, reminder_enabled=True):
                if not activity.is_for_today() or activity.is_completed_today():
                    continue

                scheduled_datetime = datetime.combine(now.date(), activity.scheduled_time)
                reminder_time = scheduled_datetime - timedelta(
                    minutes=activity.reminder_minutes_before
                )

                if reminder_time <= now < (reminder_time + timedelta(minutes=1)):
                    phrase = ActivityPhrase.objects.filter(activity=activity).first()

                    if phrase:
                        reminder_text = phrase.reminder_phrase.format(
                            activity=activity.title,
                            minutes=activity.reminder_minutes_before
                        )
                    else:
                        reminder_text = f"Reminder: {activity.title} starts in {activity.reminder_minutes_before} minutes!"

                    reminders.append({
                        'activity_id': activity.id,
                        'activity_title': activity.title,
                        'reminder_text': reminder_text,
                        'scheduled_time': activity.scheduled_time.strftime('%I:%M %p'),
                        'icon_name': activity.icon_name,
                        'color': activity.color,
                        'voice_settings': {
                            'voice_type': settings.voice_type,
                            'language': settings.language,
                            'speech_rate': settings.speech_rate,
                            'pitch': settings.pitch,
                        }
                    })

                    VoiceNotification.objects.create(
                        child=child,
                        activity=activity,
                        notification_type='reminder',
                        spoken_text=reminder_text,
                        was_spoken=True,
                        spoken_at=now
                    )

            return Response({
                'reminders': reminders,
                'child_name': child.name
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class GetActivityStartNotificationView(views.APIView):
    """Get notification for activity that's starting now"""

    def get(self, request, child_id):
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)

            settings, _ = VoiceSettings.objects.get_or_create(child=child)
            routine = DailyRoutine.objects.filter(child=child, is_active=True).first()

            if not routine:
                return Response({'notifications': []})

            now = timezone.now().time()
            notifications = []

            for activity in routine.activities.filter(is_active=True):
                if not activity.is_for_today() or activity.is_completed_today():
                    continue

                scheduled_minute = activity.scheduled_time.replace(second=0, microsecond=0)
                now_minute = now.replace(second=0, microsecond=0)

                if scheduled_minute == now_minute:
                    phrase = ActivityPhrase.objects.filter(activity=activity).first()

                    if phrase:
                        notification_text = phrase.start_phrase.format(
                            activity=activity.title
                        )
                    else:
                        notification_text = f"It's time for {activity.title}! Let's get started! 🎯"

                    notifications.append({
                        'activity_id': activity.id,
                        'activity_title': activity.title,
                        'notification_text': notification_text,
                        'duration_minutes': activity.duration_minutes,
                        'icon_name': activity.icon_name,
                        'color': activity.color,
                        'voice_settings': {
                            'voice_type': settings.voice_type,
                            'language': settings.language,
                            'speech_rate': settings.speech_rate,
                            'pitch': settings.pitch,
                        }
                    })

                    VoiceNotification.objects.create(
                        child=child,
                        activity=activity,
                        notification_type='start',
                        spoken_text=notification_text,
                        was_spoken=True,
                        spoken_at=timezone.now()
                    )

            return Response({
                'notifications': notifications,
                'child_name': child.name
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class VoiceSettingsView(views.APIView):
    """Get or update voice settings"""

    def get(self, request, child_id):
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)
            settings, _ = VoiceSettings.objects.get_or_create(child=child)

            return Response({
                'voice_type': settings.voice_type,
                'language': settings.language,
                'speech_rate': settings.speech_rate,
                'pitch': settings.pitch,
                'volume': settings.volume,
                'speak_reminders': settings.speak_reminders,
                'speak_completions': settings.speak_completions,
                'speak_encouragement': settings.speak_encouragement,
                'enable_voice_commands': settings.enable_voice_commands,
                'require_wake_word': settings.require_wake_word,
                'wake_word': settings.wake_word,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def post(self, request, child_id):
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)
            settings, _ = VoiceSettings.objects.get_or_create(child=child)

            for key, value in request.data.items():
                if hasattr(settings, key):
                    setattr(settings, key, value)

            settings.save()

            return Response({
                'success': True,
                'message': 'Voice settings updated successfully'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)
