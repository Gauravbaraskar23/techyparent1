"""
Utility functions for creating notifications
Import and use these in your screentime views and other modules
"""
from django.utils import timezone
from notifications.models import Notification



def create_screen_time_limit_notification(child, app_name, used_minutes, limit_minutes):
    """Create notification when screen time limit is reached"""
    Notification.objects.create(
        child=child,
        title="Screen Time Limit Reached",
        message=f"{app_name} has reached its daily limit! Used {used_minutes} minutes of {limit_minutes} minutes allowed.",
        notification_type='limit_reached',
        priority='high',
        action_required=True,
        related_app_package=app_name,
        related_data={
            'app_name': app_name,
            'used_minutes': used_minutes,
            'limit_minutes': limit_minutes,
            'exceeded_by': used_minutes - limit_minutes
        }
    )


def create_screen_time_warning_notification(child, app_name, used_minutes, limit_minutes, remaining_minutes):
    """Create warning when approaching screen time limit (80%)"""
    Notification.objects.create(
        child=child,
        title="Screen Time Warning",
        message=f"{app_name} is approaching its limit. Only {remaining_minutes} minutes remaining!",
        notification_type='limit_warning',
        priority='medium',
        action_required=False,
        related_app_package=app_name,
        related_data={
            'app_name': app_name,
            'used_minutes': used_minutes,
            'limit_minutes': limit_minutes,
            'remaining_minutes': remaining_minutes
        }
    )


def create_app_blocked_notification(child, app_name):
    """Create notification when app is blocked"""
    Notification.objects.create(
        child=child,
        title="App Blocked",
        message=f"{app_name} has been blocked and cannot be accessed.",
        notification_type='app_blocked',
        priority='critical',
        action_required=True,
        related_app_package=app_name,
        related_data={
            'app_name': app_name,
            'blocked_at': timezone.now().isoformat()
        }
    )


def create_goal_achieved_notification(child, goal_title):
    """Create notification when a goal is achieved"""
    Notification.objects.create(
        child=child,
        title="Goal Achieved! 🎉",
        message=f"Congratulations! {child.name} achieved the goal: {goal_title}",
        notification_type='goal_achieved',
        priority='low',
        action_required=False,
        related_data={
            'goal_title': goal_title
        }
    )


def create_daily_summary_notification(child, total_minutes, app_count):
    """Create daily summary notification"""
    hours = total_minutes // 60
    minutes = total_minutes % 60
    time_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
    
    Notification.objects.create(
        child=child,
        title="Daily Screen Time Summary",
        message=f"{child.name} used {time_str} across {app_count} apps today.",
        notification_type='info',
        priority='low',
        action_required=False,
        related_data={
            'total_minutes': total_minutes,
            'app_count': app_count
        },
        expires_at=timezone.now() + timezone.timedelta(days=1)
    )


def create_custom_notification(child, title, message, notification_type='info', priority='medium', **kwargs):
    """Create a custom notification"""
    Notification.objects.create(
        child=child,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        **kwargs
    )


def check_and_create_screen_time_notifications(child, app_name, app_package, used_minutes, limit_minutes):
    """
    Check screen time and create appropriate notifications
    Call this function from your screen time update view
    """
    # Check if notification already exists for today
    today = timezone.now().date()
    existing_notification = Notification.objects.filter(
        child=child,
        related_app_package=app_package,
        created_at__date=today,
        notification_type__in=['limit_reached', 'limit_warning', 'app_blocked']
    ).exists()
    
    if existing_notification:
        return  # Don't create duplicate notifications
    
    percentage_used = (used_minutes / limit_minutes * 100) if limit_minutes > 0 else 0
    
    # Limit reached (100%+)
    if used_minutes >= limit_minutes:
        create_screen_time_limit_notification(child, app_name, used_minutes, limit_minutes)
    
    # Warning at 80%
    elif percentage_used >= 80:
        remaining_minutes = limit_minutes - used_minutes
        create_screen_time_warning_notification(
            child, app_name, used_minutes, limit_minutes, remaining_minutes
        )