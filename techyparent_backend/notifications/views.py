from rest_framework import generics, views, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from .models import Notification
from .serializers import (
    NotificationSerializer, 
    NotificationCreateSerializer,
    NotificationSummarySerializer
)


class NotificationListView(generics.ListAPIView):
    """List all notifications for a child with filtering options"""
    serializer_class = NotificationSerializer

    def get_queryset(self):
        child_id = self.kwargs["child_id"]
        queryset = Notification.objects.filter(child_id=child_id)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by notification type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by action required
        action_required = self.request.query_params.get('action_required')
        if action_required is not None:
            queryset = queryset.filter(action_required=action_required.lower() == 'true')
        
        # Exclude expired notifications if requested
        exclude_expired = self.request.query_params.get('exclude_expired')
        if exclude_expired and exclude_expired.lower() == 'true':
            queryset = queryset.filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
            )
        
        return queryset.order_by('-created_at')


class NotificationCreateView(generics.CreateAPIView):
    """Create a new notification"""
    serializer_class = NotificationCreateSerializer
    queryset = Notification.objects.all()


class MarkAsReadView(generics.UpdateAPIView):
    """Mark a single notification as read"""
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)


class MarkAllAsReadView(views.APIView):
    """Mark all notifications as read for a child"""
    
    def post(self, request, child_id):
        updated = Notification.objects.filter(
            child_id=child_id,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'success': True,
            'marked_as_read': updated,
            'message': f'Marked {updated} notification(s) as read'
        })


class DeleteNotificationView(generics.DestroyAPIView):
    """Delete a single notification"""
    queryset = Notification.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Notification deleted successfully'
        }, status=status.HTTP_200_OK)


class ClearAllNotificationsView(views.APIView):
    """Clear all read notifications for a child"""
    
    def post(self, request, child_id):
        deleted_count, _ = Notification.objects.filter(
            child_id=child_id,
            is_read=True
        ).delete()
        
        return Response({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Cleared {deleted_count} notification(s)'
        })


class NotificationSummaryView(views.APIView):
    """Get notification summary statistics for a child"""
    
    def get(self, request, child_id):
        # Total and unread counts
        total_count = Notification.objects.filter(child_id=child_id).count()
        unread_count = Notification.objects.filter(child_id=child_id, is_read=False).count()
        critical_count = Notification.objects.filter(
            child_id=child_id,
            is_read=False,
            priority='critical'
        ).count()
        
        # Count by notification type
        by_type = {}
        type_counts = Notification.objects.filter(
            child_id=child_id,
            is_read=False
        ).values('notification_type').annotate(count=Count('id'))
        
        for item in type_counts:
            by_type[item['notification_type']] = item['count']
        
        # Latest 5 unread notifications
        latest_notifications = Notification.objects.filter(
            child_id=child_id,
            is_read=False
        ).order_by('-created_at')[:5]
        
        serializer = NotificationSummarySerializer({
            'total_count': total_count,
            'unread_count': unread_count,
            'critical_count': critical_count,
            'by_type': by_type,
            'latest_notifications': latest_notifications
        })
        
        return Response(serializer.data)


class RecentNotificationsView(views.APIView):
    """Get recent notifications (last 24 hours)"""
    
    def get(self, request, child_id):
        time_threshold = timezone.now() - timezone.timedelta(hours=24)
        
        notifications = Notification.objects.filter(
            child_id=child_id,
            created_at__gte=time_threshold
        ).order_by('-created_at')
        
        serializer = NotificationSerializer(notifications, many=True)
        
        return Response({
            'count': notifications.count(),
            'notifications': serializer.data
        })


