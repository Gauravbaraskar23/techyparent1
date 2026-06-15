from django.db import models
from django.utils import timezone
from api.models import Child

class AppLimit(models.Model):
    """Stores daily screen time limits for each app per child"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='app_limits')
    app_name = models.CharField(max_length=100)
    app_package = models.CharField(max_length=200, help_text="Package name like com.whatsapp")
    daily_limit_minutes = models.IntegerField(default=60, help_text="Daily limit in minutes")
    is_blocked = models.BooleanField(default=False, help_text="Completely block this app")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'app_package']

    def __str__(self):
        return f"{self.child.name} - {self.app_name} ({self.daily_limit_minutes}m)"


class ScreenTime(models.Model):
    """Tracks actual screen time usage per app per day"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='screen_times')
    date = models.DateField(default=timezone.now)
    app_name = models.CharField(max_length=100)
    app_package = models.CharField(max_length=200)
    duration_minutes = models.IntegerField(default=0, help_text="Screen time in minutes")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'date', 'app_package']
        ordering = ['-date', '-duration_minutes']

    def __str__(self):
        return f"{self.child.name} - {self.app_name} - {self.duration_minutes}m on {self.date}"

    def get_remaining_time(self):
        """Calculate remaining time for this app today"""
        try:
            app_limit = AppLimit.objects.get(
                child=self.child,
                app_package=self.app_package
            )
            remaining = app_limit.daily_limit_minutes - self.duration_minutes
            return max(0, remaining)
        except AppLimit.DoesNotExist:
            return None

    def is_limit_exceeded(self):
        """Check if daily limit is exceeded"""
        try:
            app_limit = AppLimit.objects.get(
                child=self.child,
                app_package=self.app_package
            )
            return self.duration_minutes >= app_limit.daily_limit_minutes or app_limit.is_blocked
        except AppLimit.DoesNotExist:
            return False


class DailyScreenTimeSummary(models.Model):
    """Stores daily summary of total screen time"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='daily_summaries')
    date = models.DateField(default=timezone.now)
    total_minutes = models.IntegerField(default=0)
    app_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.child.name} - {self.date} - {self.total_minutes}m total"

# from django.db import models
# from api.models import Child  # assuming your Parent/Child models are in dashboard app

# class ScreenTime(models.Model):
#     child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='screen_times')
#     date = models.DateField(auto_now_add=True)
#     duration = models.FloatField(help_text="Screen time in hours")
#     app_used = models.CharField(max_length=100, blank=True)

#     def __str__(self):
#         return f"{self.child.name} - {self.duration} hrs on {self.date}"

