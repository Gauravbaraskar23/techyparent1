# familybonding/views.py

from rest_framework import generics, views, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Avg, Count, Sum
from datetime import datetime, timedelta

from .models import (
    ActivityCategory, FamilyActivity, ActivityRating,
    FamilyMemory, MemoryComment, ActivityTemplate,
    BondingStreak, FamilyChallenge, QualityTimeStats,
    FamilyMilestone
)

# Import all serializers at the top
from .serializers import (
    ActivityCategorySerializer, FamilyActivitySerializer,
    FamilyActivityDetailSerializer, ActivityRatingSerializer,
    FamilyMemorySerializer, MemoryCommentSerializer,
    ActivityTemplateSerializer, BondingStreakSerializer,
    FamilyChallengeSerializer, QualityTimeStatsSerializer,
    FamilyMilestoneSerializer
)


# ============================================================================
# ACTIVITY CATEGORIES
# ============================================================================

class ActivityCategoryListView(generics.ListAPIView):
    """List all activity categories"""
    queryset = ActivityCategory.objects.all()
    serializer_class = ActivityCategorySerializer


# ============================================================================
# FAMILY ACTIVITIES
# ============================================================================

class FamilyActivityListCreateView(views.APIView):
    """List or create family activities"""
    
    def get(self, request, parent_id):
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            
            status_filter = request.query_params.get('status', 'all')
            
            activities = FamilyActivity.objects.filter(parent=parent)
            
            if status_filter != 'all':
                activities = activities.filter(status=status_filter)
            
            activities = activities.order_by('scheduled_date', 'scheduled_time')
            
            serializer = FamilyActivitySerializer(activities, many=True)
            
            return Response({
                'activities': serializer.data,
                'total': activities.count()
            })
            
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)
    
    def post(self, request, parent_id):
        """Create new family activity"""
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            
            data = request.data.copy()
            data['parent'] = parent.id
            
            serializer = FamilyActivitySerializer(data=data)
            if serializer.is_valid():
                activity = serializer.save()
                
                # Update streak
                streak, _ = BondingStreak.objects.get_or_create(parent=parent)
                streak.total_activities += 1
                streak.save()
                
                return Response({
                    'success': True,
                    'message': 'Activity created! 🎉',
                    'activity': serializer.data
                }, status=201)
            
            return Response(serializer.errors, status=400)
            
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)


class FamilyActivityDetailView(views.APIView):
    """Get, update, or delete an activity"""
    
    def get(self, request, activity_id):
        try:
            activity = FamilyActivity.objects.get(id=activity_id)
            serializer = FamilyActivityDetailSerializer(activity)
            return Response(serializer.data)
        except FamilyActivity.DoesNotExist:
            return Response({'error': 'Activity not found'}, status=404)
    
    def patch(self, request, activity_id):
        """Update an activity"""
        try:
            activity = FamilyActivity.objects.get(id=activity_id)
            serializer = FamilyActivitySerializer(activity, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Activity updated!',
                    'activity': serializer.data
                })
            
            return Response(serializer.errors, status=400)
        except FamilyActivity.DoesNotExist:
            return Response({'error': 'Activity not found'}, status=404)
    
    def delete(self, request, activity_id):
        """Delete an activity"""
        try:
            activity = FamilyActivity.objects.get(id=activity_id)
            activity.delete()
            return Response({
                'success': True,
                'message': 'Activity deleted'
            })
        except FamilyActivity.DoesNotExist:
            return Response({'error': 'Activity not found'}, status=404)


class CompleteActivityView(views.APIView):
    """Mark activity as completed"""
    
    def post(self, request, activity_id):
        actual_duration = request.data.get('actual_duration')
        
        try:
            activity = FamilyActivity.objects.get(id=activity_id)
            activity.mark_completed(actual_duration=actual_duration)
            
            # Update streak
            streak, _ = BondingStreak.objects.get_or_create(parent=activity.parent)
            streak.update_streak()
            
            if actual_duration:
                streak.total_hours += actual_duration // 60
                streak.save()
            
            # Check milestones
            self._check_milestones(activity.parent)
            
            return Response({
                'success': True,
                'message': 'Activity completed! 🎉',
                'completed_at': activity.completed_at
            })
            
        except FamilyActivity.DoesNotExist:
            return Response({'error': 'Activity not found'}, status=404)
    
    def _check_milestones(self, parent):
        """Check and award milestones"""
        total = FamilyActivity.objects.filter(parent=parent, status='completed').count()
        
        milestones = [10, 25, 50, 100, 250]
        for milestone_value in milestones:
            if total == milestone_value:
                FamilyMilestone.objects.get_or_create(
                    parent=parent,
                    milestone_type='activity_count',
                    value=milestone_value,
                    defaults={
                        'title': f'{milestone_value} Activities Together!',
                        'description': f'You completed {milestone_value} family activities!'
                    }
                )


# ============================================================================
# RATINGS & FEEDBACK
# ============================================================================

class ActivityRatingView(views.APIView):
    """Rate a completed activity"""
    
    def post(self, request, activity_id):
        from api.models import Child
        
        child_id = request.data.get('child_id')
        rating = request.data.get('rating')
        fun_level = request.data.get('fun_level', 3)
        feedback = request.data.get('feedback', '')
        favorite = request.data.get('favorite', False)
        
        try:
            activity = FamilyActivity.objects.get(id=activity_id)
            child = Child.objects.get(id=child_id)
            
            rating_obj, created = ActivityRating.objects.update_or_create(
                activity=activity,
                child=child,
                defaults={
                    'rating': rating,
                    'fun_level': fun_level,
                    'feedback': feedback,
                    'favorite': favorite
                }
            )
            
            serializer = ActivityRatingSerializer(rating_obj)
            
            return Response({
                'success': True,
                'message': 'Thanks for your feedback! ⭐',
                'rating': serializer.data
            })
            
        except (FamilyActivity.DoesNotExist, Child.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)


# ============================================================================
# MEMORIES
# ============================================================================

class FamilyMemoryListCreateView(views.APIView):
    """List or create family memories"""
    
    def get(self, request, parent_id):
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            
            memories = FamilyMemory.objects.filter(
                activity__parent=parent
            ).order_by('-memory_date')
            
            serializer = FamilyMemorySerializer(memories, many=True)
            
            return Response({
                'memories': serializer.data,
                'total': memories.count()
            })
            
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)
    
    def post(self, request, parent_id):
        """Create new memory"""
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            
            data = request.data.copy()
            data['created_by'] = parent.id
            
            serializer = FamilyMemorySerializer(data=data)
            if serializer.is_valid():
                memory = serializer.save()
                return Response({
                    'success': True,
                    'message': 'Memory saved! 📸',
                    'memory': serializer.data
                }, status=201)
            
            return Response(serializer.errors, status=400)
            
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)


class MemoryCommentView(views.APIView):
    """Add comment to memory"""
    
    def post(self, request, memory_id):
        try:
            memory = FamilyMemory.objects.get(id=memory_id)
            
            data = request.data.copy()
            data['memory'] = memory.id
            
            serializer = MemoryCommentSerializer(data=data)
            if serializer.is_valid():
                comment = serializer.save()
                
                # Update comment count
                memory.comments_count += 1
                memory.save()
                
                return Response({
                    'success': True,
                    'comment': serializer.data
                })
            
            return Response(serializer.errors, status=400)
            
        except FamilyMemory.DoesNotExist:
            return Response({'error': 'Memory not found'}, status=404)


# ============================================================================
# TEMPLATES
# ============================================================================

class ActivityTemplateListView(views.APIView):
    """Get activity templates"""
    
    def get(self, request):
        category = request.query_params.get('category')
        
        templates = ActivityTemplate.objects.all()
        
        if category:
            templates = templates.filter(category__name=category)
        
        templates = templates.order_by('-is_popular', '-times_used')[:20]
        
        serializer = ActivityTemplateSerializer(templates, many=True)
        
        return Response({
            'templates': serializer.data,
            'count': len(serializer.data)
        })


class CreateFromTemplateView(views.APIView):
    """Create activity from template"""
    
    def post(self, request):
        from api.models import Parent
        parent_id = request.data.get('parent_id')
        template_id = request.data.get('template_id')
        scheduled_date = request.data.get('scheduled_date')
        children_ids = request.data.get('children', [])
        
        try:
            parent = Parent.objects.get(id=parent_id)
            template = ActivityTemplate.objects.get(id=template_id)
            
            # Create activity from template
            activity = FamilyActivity.objects.create(
                parent=parent,
                title=template.title,
                description=template.description,
                category=template.category,
                scheduled_date=scheduled_date,
                duration_minutes=template.duration_minutes,
                difficulty=template.difficulty,
                materials_needed=template.materials_needed,
                is_outdoor=template.is_outdoor,
                cost_estimate=template.cost_estimate,
                status='planned'
            )
            
            # Add children
            activity.children.set(children_ids)
            
            # Update template usage
            template.times_used += 1
            template.save()
            
            return Response({
                'success': True,
                'message': 'Activity created from template! 🎉',
                'activity': FamilyActivitySerializer(activity).data
            })
            
        except (Parent.DoesNotExist, ActivityTemplate.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)


# ============================================================================
# DASHBOARD & STATS
# ============================================================================

class FamilyBondingDashboardView(views.APIView):
    """Complete dashboard data"""
    
    def get(self, request, parent_id):
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            today = timezone.now().date()
            
            # Upcoming activities
            upcoming = FamilyActivity.objects.filter(
                parent=parent,
                status='planned',
                scheduled_date__gte=today
            ).order_by('scheduled_date')[:5]
            
            # Recent completed
            recent = FamilyActivity.objects.filter(
                parent=parent,
                status='completed'
            ).order_by('-completed_at')[:3]
            
            # Streak
            streak, _ = BondingStreak.objects.get_or_create(parent=parent)
            
            # Active challenge
            active_challenge = FamilyChallenge.objects.filter(
                parent=parent,
                status='active'
            ).first()
            
            # This month stats
            month_start = today.replace(day=1)
            this_month = FamilyActivity.objects.filter(
                parent=parent,
                scheduled_date__gte=month_start,
                status='completed'
            )
            
            # Average ratings
            avg_rating = ActivityRating.objects.filter(
                activity__parent=parent
            ).aggregate(avg=Avg('rating'))
            
            return Response({
                'upcoming_activities': FamilyActivitySerializer(upcoming, many=True).data,
                'recent_completed': FamilyActivitySerializer(recent, many=True).data,
                'streak': BondingStreakSerializer(streak).data,
                'active_challenge': FamilyChallengeSerializer(active_challenge).data if active_challenge else None,
                'this_month_count': this_month.count(),
                'total_completed': FamilyActivity.objects.filter(parent=parent, status='completed').count(),
                'average_rating': round(avg_rating['avg'] or 0, 1),
            })
            
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)


class QualityTimeStatsView(views.APIView):
    """Get quality time statistics"""
    
    def get(self, request, parent_id):
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            period = request.query_params.get('period', 'month')  # week, month, year
            
            today = timezone.now().date()
            
            if period == 'week':
                start_date = today - timedelta(days=7)
            elif period == 'month':
                start_date = today - timedelta(days=30)
            else:
                start_date = today - timedelta(days=365)
            
            activities = FamilyActivity.objects.filter(
                parent=parent,
                status='completed',
                completed_at__date__gte=start_date
            )
            
            # Calculate stats
            total_activities = activities.count()
            total_hours = activities.aggregate(
                total=Sum('actual_duration_minutes')
            )['total'] or 0
            total_hours = total_hours / 60
            
            indoor = activities.filter(is_outdoor=False).count()
            outdoor = activities.filter(is_outdoor=True).count()
            
            # Category breakdown
            category_breakdown = {}
            for activity in activities:
                if activity.category:
                    cat_name = activity.category.display_name
                    category_breakdown[cat_name] = category_breakdown.get(cat_name, 0) + 1
            
            # Ratings
            ratings = ActivityRating.objects.filter(
                activity__in=activities
            )
            avg_rating = ratings.aggregate(avg=Avg('rating'))['avg'] or 0
            avg_fun = ratings.aggregate(avg=Avg('fun_level'))['avg'] or 0
            
            return Response({
                'period': period,
                'total_activities': total_activities,
                'total_hours': round(total_hours, 1),
                'indoor_activities': indoor,
                'outdoor_activities': outdoor,
                'category_breakdown': category_breakdown,
                'average_rating': round(avg_rating, 1),
                'average_fun_level': round(avg_fun, 1),
            })
            
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)


# ============================================================================
# CHALLENGES
# ============================================================================

class FamilyChallengeView(views.APIView):
    """Create and manage family challenges"""
    
    def get(self, request, parent_id):
        """List challenges"""
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            challenges = FamilyChallenge.objects.filter(parent=parent)
            serializer = FamilyChallengeSerializer(challenges, many=True)
            return Response({'challenges': serializer.data})
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)
    
    def post(self, request, parent_id):
        """Create new challenge"""
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            
            data = request.data.copy()
            data['parent'] = parent.id
            
            serializer = FamilyChallengeSerializer(data=data)
            if serializer.is_valid():
                challenge = serializer.save()
                return Response({
                    'success': True,
                    'message': 'Challenge created! 🎯',
                    'challenge': serializer.data
                }, status=201)
            
            return Response(serializer.errors, status=400)
            
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)


class UpdateChallengeProgressView(views.APIView):
    """Update challenge progress"""
    
    def post(self, request, challenge_id):
        try:
            challenge = FamilyChallenge.objects.get(id=challenge_id)
            
            # Update progress based on completed activities
            completed = FamilyActivity.objects.filter(
                parent=challenge.parent,
                status='completed',
                completed_at__date__gte=challenge.start_date,
                completed_at__date__lte=challenge.end_date
            )
            
            challenge.activities_completed = completed.count()
            
            total_duration = completed.aggregate(
                total=Sum('actual_duration_minutes')
            )['total'] or 0
            challenge.hours_completed = total_duration // 60
            
            challenge.save()
            
            # Check if completed
            if challenge.check_completion():
                return Response({
                    'success': True,
                    'message': '🎉 Challenge completed! You earned the reward!',
                    'completed': True,
                    'reward': challenge.reward_description
                })
            
            return Response({
                'success': True,
                'activities_completed': challenge.activities_completed,
                'hours_completed': challenge.hours_completed,
                'completed': False
            })
            
        except FamilyChallenge.DoesNotExist:
            return Response({'error': 'Challenge not found'}, status=404)


# ============================================================================
# MILESTONES
# ============================================================================

class FamilyMilestonesView(views.APIView):
    """Get family milestones"""
    
    def get(self, request, parent_id):
        from api.models import Parent
        
        try:
            parent = Parent.objects.get(id=parent_id)
            milestones = FamilyMilestone.objects.filter(parent=parent)
            serializer = FamilyMilestoneSerializer(milestones, many=True)
            
            return Response({
                'milestones': serializer.data,
                'total': milestones.count()
            })
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)