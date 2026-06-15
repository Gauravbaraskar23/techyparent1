from rest_framework import serializers
from .models import (
    RoutineCategory, DailyRoutine, RoutineActivity, 
    RoutineCompletion, RoutineTemplate
)
from django.utils import timezone


class RoutineCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutineCategory
        fields = ['id', 'name', 'display_name', 'icon_name', 'color', 'order']


class RoutineCompletionSerializer(serializers.ModelSerializer):
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    
    class Meta:
        model = RoutineCompletion
        fields = [
            'id', 'activity', 'activity_title', 'date',
            'is_completed', 'completed_at', 'notes',
            'was_on_time', 'difficulty_rating',
            'created_at'
        ]


class RoutineActivitySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    is_completed_today = serializers.SerializerMethodField()
    is_for_today = serializers.SerializerMethodField()
    end_time = serializers.SerializerMethodField()
    time_display = serializers.SerializerMethodField()
    
    class Meta:
        model = RoutineActivity
        fields = [
            'id', 'routine', 'category', 'category_name', 'category_color',
            'title', 'description', 'scheduled_time', 'duration_minutes',
            'is_recurring', 'specific_days', 'reminder_enabled',
            'reminder_minutes_before', 'icon_name', 'color',
            'is_mandatory', 'order', 'is_active',
            'is_completed_today', 'is_for_today', 'end_time', 'time_display',
            'created_at', 'updated_at'
        ]
    
    def get_is_completed_today(self, obj):
        return obj.is_completed_today()
    
    def get_is_for_today(self, obj):
        return obj.is_for_today()
    
    def get_end_time(self, obj):
        end_time = obj.get_end_time()
        return end_time.strftime('%H:%M')
    
    def get_time_display(self, obj):
        """Format time nicely for display"""
        return obj.scheduled_time.strftime('%I:%M %p')


class DailyRoutineSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    activities = RoutineActivitySerializer(many=True, read_only=True)
    total_activities = serializers.SerializerMethodField()
    completed_today = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyRoutine
        fields = [
            'id', 'child', 'child_name', 'title', 'is_active',
            'activities', 'total_activities', 'completed_today',
            'completion_percentage', 'created_at', 'updated_at'
        ]
    
    def get_total_activities(self, obj):
        return obj.get_total_activities()
    
    def get_completed_today(self, obj):
        return obj.get_completed_today()
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage_today()


class DailyRoutineSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard"""
    child_name = serializers.CharField(source='child.name', read_only=True)
    total_activities = serializers.SerializerMethodField()
    completed_today = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    next_activity = serializers.SerializerMethodField()
    current_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyRoutine
        fields = [
            'id', 'child', 'child_name', 'title',
            'total_activities', 'completed_today', 'completion_percentage',
            'next_activity', 'current_activity'
        ]
    
    def get_total_activities(self, obj):
        return obj.get_total_activities()
    
    def get_completed_today(self, obj):
        return obj.get_completed_today()
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage_today()
    
    def get_next_activity(self, obj):
        """Get the next scheduled activity"""
        now = timezone.now().time()
        today = timezone.now().strftime('%A').lower()
        
        # Get activities for today that haven't been completed
        activities = obj.activities.filter(
            is_active=True,
            scheduled_time__gt=now
        ).order_by('scheduled_time')
        
        # Filter by day if specific days
        next_activities = []
        for activity in activities:
            if activity.is_for_today() and not activity.is_completed_today():
                next_activities.append(activity)
        
        if next_activities:
            activity = next_activities[0]
            return {
                'id': activity.id,
                'title': activity.title,
                'scheduled_time': activity.scheduled_time.strftime('%I:%M %p'),
                'icon_name': activity.icon_name,
                'color': activity.color,
                'duration_minutes': activity.duration_minutes
            }
        return None
    
    def get_current_activity(self, obj):
        """Get currently ongoing activity"""
        now = timezone.now().time()
        
        # Find activity where current time is between start and end time
        for activity in obj.activities.filter(is_active=True):
            if not activity.is_for_today():
                continue
            
            end_time = activity.get_end_time()
            if activity.scheduled_time <= now <= end_time:
                if not activity.is_completed_today():
                    return {
                        'id': activity.id,
                        'title': activity.title,
                        'scheduled_time': activity.scheduled_time.strftime('%I:%M %p'),
                        'end_time': end_time.strftime('%I:%M %p'),
                        'icon_name': activity.icon_name,
                        'color': activity.color
                    }
        return None


class RoutineTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutineTemplate
        fields = [
            'id', 'name', 'description', 'age_group',
            'activities_data', 'is_public', 'created_at'
        ]


class CreateRoutineFromTemplateSerializer(serializers.Serializer):
    """Serializer for creating routine from template"""
    child_id = serializers.IntegerField()
    template_id = serializers.IntegerField()
    customize = serializers.BooleanField(default=False)


class BulkActivityUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating activity completions"""
    activity_ids = serializers.ListField(child=serializers.IntegerField())
    is_completed = serializers.BooleanField()
    date = serializers.DateField(required=False)