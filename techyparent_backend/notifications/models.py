from django.db import models
from api.models import Child

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('warning', 'Warning'),
        ('alert', 'Alert'),
        ('info', 'Information'),
        ('success', 'Success'),
        ('limit_reached', 'Limit Reached'),
        ('limit_warning', 'Limit Warning'),
        ('app_blocked', 'App Blocked'),
        ('goal_achieved', 'Goal Achieved'),
        ('general', 'General'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default="general")
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default="medium")
    is_read = models.BooleanField(default=False)
    
    # Additional fields for better functionality
    action_required = models.BooleanField(default=False, help_text="Does this notification require parent action?")
    related_app_package = models.CharField(max_length=200, blank=True, null=True, help_text="Related app package if applicable")
    related_data = models.JSONField(blank=True, null=True, help_text="Additional data for the notification")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True, help_text="Optional expiry time for notification")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['child', '-created_at']),
            models.Index(fields=['is_read', '-created_at']),
        ]

    def __str__(self):
        return f"{self.child.name} - {self.title} ({self.notification_type})"
    
    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])



# from django.db import models
# from api.models import Child

# class Notification(models.Model):
#     child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="notifications")
#     title = models.CharField(max_length=255)
#     message = models.TextField()
#     notification_type = models.CharField(max_length=50, default="general")  
#     is_read = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.child.name} - {self.title}"
