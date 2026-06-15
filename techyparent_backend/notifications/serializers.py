from rest_framework import serializers
from .models import Notification
from django.utils import timezone

class NotificationSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    time_ago = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'child', 'child_name', 'title', 'message', 
            'notification_type', 'priority', 'is_read', 'action_required',
            'related_app_package', 'related_data', 
            'created_at', 'read_at', 'expires_at',
            'time_ago', 'is_expired'
        ]
        read_only_fields = ['created_at', 'read_at']

    def get_time_ago(self, obj):
        """Get human-readable time difference"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    
    def get_is_expired(self, obj):
        """Check if notification has expired"""
        if obj.expires_at:
            return timezone.now() > obj.expires_at
        return False


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    class Meta:
        model = Notification
        fields = [
            'child', 'title', 'message', 'notification_type', 
            'priority', 'action_required', 'related_app_package',
            'related_data', 'expires_at'
        ]


class NotificationSummarySerializer(serializers.Serializer):
    """Serializer for notification summary statistics"""
    total_count = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    critical_count = serializers.IntegerField()
    by_type = serializers.DictField()
    latest_notifications = NotificationSerializer(many=True)


# from rest_framework import serializers
# from .models import Notification

# class NotificationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Notification
#         fields = "__all__"
