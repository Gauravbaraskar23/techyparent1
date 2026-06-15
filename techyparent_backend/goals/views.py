
from rest_framework import generics, views, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from datetime import datetime, timedelta

from .models import (
    GoalCategory, Goal, GoalMilestone, DailyGoalLog,
    GoalComment, GoalTemplate, ChildPoints, GoalReminder,
    CollaborativeGoal, GoalContribution, GoalBadge,
    ChildGoalBadge, GoalAnalytics
)

# CATEGORIES & TEMPLATES

class GoalCategoryListView(generics.ListAPIView):
    """List all goal categories"""
    from .serializers import GoalCategorySerializer
    queryset = GoalCategory.objects.all()
    
    def get_serializer_class(self):
        from .serializers import GoalCategorySerializer
        return GoalCategorySerializer


class GoalTemplateListView(views.APIView):
    """Get goal templates filtered by category"""
    
    def get(self, request):
        from .serializers import GoalTemplateSerializer
        category = request.query_params.get('category')
        age_group = request.query_params.get('age_group', 'all')
        
        templates = GoalTemplate.objects.filter(is_active=True) if hasattr(GoalTemplate, 'is_active') else GoalTemplate.objects.all()
        
        if category:
            templates = templates.filter(category__name=category)
        
        if age_group != 'all':
            templates = templates.filter(Q(age_group=age_group) | Q(age_group='all'))
        
        templates = templates.order_by('-is_popular', '-times_used')[:20]
        
        serializer = GoalTemplateSerializer(templates, many=True)
        return Response({
            'templates': serializer.data,
            'count': len(serializer.data)
        })


# ============================================================================
# GOALS CRUD
# ============================================================================

class GoalListCreateView(views.APIView):
    """List or create goals for a child"""
    
    def get(self, request, child_id):
        from .serializers import GoalSerializer
        from api.models import Child
        
        try:
            child = Child.objects.get(id=child_id)
            
            # Filter options
            status_filter = request.query_params.get('status', 'active')
            category_filter = request.query_params.get('category')
            
            goals = Goal.objects.filter(child=child)
            
            if status_filter != 'all':
                goals = goals.filter(status=status_filter)
            
            if category_filter:
                goals = goals.filter(category__name=category_filter)
            
            serializer = GoalSerializer(goals, many=True)
            
            # Summary stats
            total_active = Goal.objects.filter(child=child, status='active').count()
            total_completed = Goal.objects.filter(child=child, status='completed').count()
            
            return Response({
                'goals': serializer.data,
                'total_active': total_active,
                'total_completed': total_completed,
                'child_name': child.name
            })
            
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)
    
    def post(self, request, child_id):
        """Create a new goal"""
        from api.models import Child
        from .serializers import GoalSerializer
        
        try:
            child = Child.objects.get(id=child_id)
            
            data = request.data.copy()
            data['child'] = child.id
            
            serializer = GoalSerializer(data=data)
            if serializer.is_valid():
                goal = serializer.save()
                
                # Create milestones if provided
                milestones_data = request.data.get('milestones', [])
                for idx, milestone in enumerate(milestones_data):
                    GoalMilestone.objects.create(
                        goal=goal,
                        title=milestone['title'],
                        target_value=milestone['target_value'],
                        order=idx
                    )
                
                return Response({
                    'success': True,
                    'message': 'Goal created successfully! 🎯',
                    'goal': serializer.data
                }, status=201)
            
            return Response(serializer.errors, status=400)
            
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)


class GoalDetailView(views.APIView):
    """Get, update, or delete a specific goal"""
    
    def get(self, request, goal_id):
        from .serializers import GoalDetailSerializer
        try:
            goal = Goal.objects.get(id=goal_id)
            serializer = GoalDetailSerializer(goal)
            return Response(serializer.data)
        except Goal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)
    
    def patch(self, request, goal_id):
        """Update a goal"""
        from .serializers import GoalSerializer
        try:
            goal = Goal.objects.get(id=goal_id)
            serializer = GoalSerializer(goal, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Goal updated!',
                    'goal': serializer.data
                })
            
            return Response(serializer.errors, status=400)
        except Goal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)
    
    def delete(self, request, goal_id):
        """Delete a goal"""
        try:
            goal = Goal.objects.get(id=goal_id)
            goal.delete()
            return Response({
                'success': True,
                'message': 'Goal deleted successfully'
            })
        except Goal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)


class CreateGoalFromTemplateView(views.APIView):
    """Create a goal from a template"""
    
    def post(self, request):
        from api.models import Child
        child_id = request.data.get('child_id')
        template_id = request.data.get('template_id')
        
        try:
            child = Child.objects.get(id=child_id)
            template = GoalTemplate.objects.get(id=template_id)
            
            # Create goal from template
            goal = Goal.objects.create(
                child=child,
                category=template.category,
                title=template.title,
                description=template.description,
                icon_name=template.icon_name,
                color=template.color,
                target_value=template.default_target,
                unit=template.default_unit,
                frequency=template.default_frequency,
                priority=template.default_priority,
                status='active'
            )
            
            # Update template usage
            template.times_used += 1
            template.save()
            
            from .serializers import GoalSerializer
            return Response({
                'success': True,
                'message': f'Goal created from template: {template.title}',
                'goal': GoalSerializer(goal).data
            })
            
        except (Child.DoesNotExist, GoalTemplate.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)


# ============================================================================
# GOAL ACTIONS
# ============================================================================

class UpdateGoalProgressView(views.APIView):
    """Update goal progress"""
    
    def post(self, request, goal_id):
        value = request.data.get('value', 1)
        notes = request.data.get('notes', '')
        
        try:
            goal = Goal.objects.get(id=goal_id)
            old_value = goal.current_value
            
            goal.add_progress(value)
            
            # If daily/weekly goal, create log entry
            if goal.frequency in ['daily', 'weekly']:
                today = timezone.now().date()
                log, created = DailyGoalLog.objects.get_or_create(
                    goal=goal,
                    date=today,
                    defaults={'value_achieved': value, 'notes': notes}
                )
                
                if not created:
                    log.value_achieved += value
                    if notes:
                        log.notes = notes
                    log.save()
                
                # Check if completed today
                if goal.current_value >= goal.target_value:
                    log.completed = True
                    log.completed_at = timezone.now()
                    log.save()
            
            # Update streak
            points, _ = ChildPoints.objects.get_or_create(child=goal.child)
            points.update_streak(completed_today=True)
            
            # Check badges
            self._check_and_award_badges(goal)
            
            message = f"Progress updated! {goal.current_value}/{goal.target_value} {goal.unit}"
            if goal.status == 'completed':
                message = f"🎉 Goal completed! You earned {goal.reward_points} points!"
            
            return Response({
                'success': True,
                'message': message,
                'goal_status': goal.status,
                'progress_percentage': goal.get_progress_percentage(),
                'current_value': goal.current_value,
                'target_value': goal.target_value
            })
            
        except Goal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)
    
    def _check_and_award_badges(self, goal):
        """Check and award badges based on goal completion"""
        child = goal.child
        
        # Completion badge
        completed_count = Goal.objects.filter(child=child, status='completed').count()
        for milestone in [1, 5, 10, 25, 50]:
            if completed_count == milestone:
                badge = GoalBadge.objects.filter(
                    badge_type='completion',
                    requirement=milestone
                ).first()
                if badge:
                    ChildGoalBadge.objects.get_or_create(
                        child=child,
                        badge=badge,
                        defaults={'related_goal': goal}
                    )
        
        # Streak badge
        points = ChildPoints.objects.get(child=child)
        if points.current_streak in [7, 14, 30, 100]:
            badge = GoalBadge.objects.filter(
                badge_type='streak',
                requirement=points.current_streak
            ).first()
            if badge:
                ChildGoalBadge.objects.get_or_create(child=child, badge=badge)


class ToggleGoalPauseView(views.APIView):
    """Pause or resume a goal"""
    
    def post(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id)
            
            if goal.status == 'active':
                goal.status = 'paused'
                message = "Goal paused"
            elif goal.status == 'paused':
                goal.status = 'active'
                message = "Goal resumed"
            else:
                return Response({'error': 'Cannot pause/resume this goal'}, status=400)
            
            goal.save()
            
            return Response({
                'success': True,
                'message': message,
                'status': goal.status
            })
            
        except Goal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)


class CompleteGoalView(views.APIView):
    """Manually mark a goal as complete"""
    
    def post(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id)
            goal.mark_complete()
            
            return Response({
                'success': True,
                'message': f'🎉 Goal completed! You earned {goal.reward_points} points!',
                'points_earned': goal.reward_points
            })
        except Goal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)


# ============================================================================
# COMMENTS & ENCOURAGEMENT
# ============================================================================

class GoalCommentView(views.APIView):
    """Add comment/encouragement to a goal"""
    
    def get(self, request, goal_id):
        """Get comments for a goal"""
        from .serializers import GoalCommentSerializer
        comments = GoalComment.objects.filter(goal_id=goal_id)
        serializer = GoalCommentSerializer(comments, many=True)
        return Response({'comments': serializer.data})
    
    def post(self, request, goal_id):
        """Add a comment"""
        from .serializers import GoalCommentSerializer
        try:
            goal = Goal.objects.get(id=goal_id)
            
            data = request.data.copy()
            data['goal'] = goal.id
            
            serializer = GoalCommentSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'comment': serializer.data
                })
            
            return Response(serializer.errors, status=400)
        except Goal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)


# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

class GoalDashboardView(views.APIView):
    """Complete dashboard data for goals"""
    
    def get(self, request, child_id):
        from api.models import Child
        from .serializers import GoalSerializer, ChildPointsSerializer
        
        try:
            child = Child.objects.get(id=child_id)
            today = timezone.now().date()
            
            # Active goals
            active_goals = Goal.objects.filter(
                child=child,
                status='active'
            ).order_by('-priority', 'end_date')[:5]
            
            # Today's due goals
            today_goals = Goal.objects.filter(
                child=child,
                status='active',
                frequency='daily'
            )
            
            # Check which are completed today
            today_completed = []
            for goal in today_goals:
                log = DailyGoalLog.objects.filter(goal=goal, date=today, completed=True).first()
                if log:
                    today_completed.append(goal.id)
            
            # Points & level
            points, _ = ChildPoints.objects.get_or_create(child=child)
            
            # Recent completions
            recent = Goal.objects.filter(
                child=child,
                status='completed'
            ).order_by('-completed_at')[:3]
            
            # Overdue goals
            overdue = Goal.objects.filter(
                child=child,
                status='active',
                end_date__lt=today
            )
            
            # Category breakdown
            category_stats = Goal.objects.filter(child=child).values(
                'category__display_name'
            ).annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status='completed'))
            )
            
            return Response({
                'child_name': child.name,
                'points': ChildPointsSerializer(points).data,
                'active_goals': GoalSerializer(active_goals, many=True).data,
                'today_goals_count': today_goals.count(),
                'today_completed_count': len(today_completed),
                'today_completed_ids': today_completed,
                'recent_completions': GoalSerializer(recent, many=True).data,
                'overdue_count': overdue.count(),
                'overdue_goals': GoalSerializer(overdue, many=True).data,
                'category_stats': list(category_stats),
                'total_goals': Goal.objects.filter(child=child).count(),
                'completion_rate': self._calculate_completion_rate(child),
            })
            
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)
    
    def _calculate_completion_rate(self, child):
        """Calculate overall completion rate"""
        total = Goal.objects.filter(child=child).count()
        if total == 0:
            return 0
        completed = Goal.objects.filter(child=child, status='completed').count()
        return int((completed / total) * 100)


class GoalAnalyticsView(views.APIView):
    """Detailed analytics for goals"""
    
    def get(self, request, child_id):
        from api.models import Child
        try:
            child = Child.objects.get(id=child_id)
            period = request.query_params.get('period', 'week')  # week, month, year
            
            if period == 'week':
                start_date = timezone.now().date() - timedelta(days=7)
            elif period == 'month':
                start_date = timezone.now().date() - timedelta(days=30)
            else:
                start_date = timezone.now().date() - timedelta(days=365)
            
            # Goals created in period
            goals_in_period = Goal.objects.filter(
                child=child,
                created_at__date__gte=start_date
            )
            
            # Completion stats
            completed = goals_in_period.filter(status='completed').count()
            failed = goals_in_period.filter(status='failed').count()
            active = goals_in_period.filter(status='active').count()
            
            # Daily completion trend (last 7 days)
            daily_trend = []
            for i in range(7):
                date = timezone.now().date() - timedelta(days=i)
                completed_on_date = DailyGoalLog.objects.filter(
                    goal__child=child,
                    date=date,
                    completed=True
                ).count()
                daily_trend.append({
                    'date': date,
                    'day': date.strftime('%a'),
                    'completed': completed_on_date
                })
            
            # Category performance
            category_performance = []
            for cat in GoalCategory.objects.all():
                cat_goals = Goal.objects.filter(child=child, category=cat)
                cat_completed = cat_goals.filter(status='completed').count()
                cat_total = cat_goals.count()
                
                if cat_total > 0:
                    category_performance.append({
                        'category': cat.display_name,
                        'total': cat_total,
                        'completed': cat_completed,
                        'rate': int((cat_completed / cat_total) * 100),
                        'color': cat.color
                    })
            
            return Response({
                'period': period,
                'total_goals': goals_in_period.count(),
                'completed': completed,
                'failed': failed,
                'active': active,
                'completion_rate': int((completed / goals_in_period.count() * 100)) if goals_in_period.count() > 0 else 0,
                'daily_trend': list(reversed(daily_trend)),
                'category_performance': category_performance,
            })
            
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)


# ============================================================================
# BADGES
# ============================================================================

class GoalBadgesView(views.APIView):
    """Get earned and available badges"""
    
    def get(self, request, child_id):
        from .serializers import ChildGoalBadgeSerializer, GoalBadgeSerializer
        
        earned = ChildGoalBadge.objects.filter(child_id=child_id).select_related('badge')
        all_badges = GoalBadge.objects.filter(is_active=True)
        
        earned_ids = earned.values_list('badge_id', flat=True)
        
        return Response({
            'earned': ChildGoalBadgeSerializer(earned, many=True).data,
            'available': GoalBadgeSerializer(
                all_badges.exclude(id__in=earned_ids), many=True
            ).data,
            'total_earned': earned.count(),
            'total_available': all_badges.count()
        })


# ============================================================================
# COLLABORATIVE GOALS
# ============================================================================

class CollaborativeGoalView(views.APIView):
    """Create and manage collaborative goals"""
    
    def post(self, request):
        """Create a collaborative goal"""
        from api.models import Child
        
        goal_data = request.data.get('goal')
        participant_ids = request.data.get('participants', [])
        
        try:
            # Create the base goal
            child = Child.objects.get(id=goal_data['child_id'])
            
            goal = Goal.objects.create(
                child=child,
                title=goal_data['title'],
                description=goal_data.get('description', ''),
                target_value=goal_data['target_value'],
                unit=goal_data.get('unit', 'times'),
                is_collaborative=True
            )
            
            # Create collaborative record
            collab = CollaborativeGoal.objects.create(goal=goal)
            
            # Add participants
            for participant_id in participant_ids:
                participant = Child.objects.get(id=participant_id)
                collab.participants.add(participant)
            
            return Response({
                'success': True,
                'message': 'Collaborative goal created!',
                'goal_id': goal.id
            })
            
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)