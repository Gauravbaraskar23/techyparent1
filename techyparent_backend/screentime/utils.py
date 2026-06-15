from django.utils import timezone
from django.db.models import Sum
from notifications.models import Notification

def check_screen_time(child):
    today = timezone.now().date()

    # Total hours used today
    today_total = child.screentime_set.filter(date=today).aggregate(
        total_hours=Sum('duration')
    )['total_hours'] or 0

    # Check limit
    if today_total > child.allowed_daily_hours:
        Notification.objects.create(
            child=child,
            title="Screen Time Limit Exceeded",
            message=f"{child.name} used {today_total} hours today!",
            notification_type="warning"
        )
