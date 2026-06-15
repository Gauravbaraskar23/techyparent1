from django.db import models
from django.utils import timezone
from api.models import Child


class DailyReport(models.Model):
    """Daily activity report for a child"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='daily_reports')
    date = models.DateField(default=timezone.now)
    
    # Screen Time Data
    total_screen_time_minutes = models.IntegerField(default=0, help_text="Total screen time in minutes")
    apps_used_count = models.IntegerField(default=0, help_text="Number of apps used")
    most_used_app = models.CharField(max_length=100, blank=True, null=True)
    
    # Learning Data
    videos_watched = models.IntegerField(default=0, help_text="Number of learning videos watched")
    learning_time_minutes = models.IntegerField(default=0, help_text="Time spent on learning content")
    learning_categories = models.JSONField(default=dict, help_text="Categories and time spent")
    
    # Goals Data
    goals_achieved = models.IntegerField(default=0, help_text="Goals completed today")
    goals_in_progress = models.IntegerField(default=0, help_text="Active goals")
    
    # Activity Metrics
    engagement_score = models.FloatField(default=0.0, help_text="Engagement score (0-100)")
    activity_change_percentage = models.FloatField(default=0.0, help_text="Change from previous day")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['child', '-date']),
        ]

    def __str__(self):
        return f"{self.child.name} - {self.date}"


class WeeklyReport(models.Model):
    """Weekly summary report"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='weekly_reports')
    week_start_date = models.DateField()
    week_end_date = models.DateField()
    
    # Aggregated Data
    avg_daily_screen_time_minutes = models.IntegerField(default=0)
    total_videos_watched = models.IntegerField(default=0)
    total_goals_achieved = models.IntegerField(default=0)
    
    # Trends
    screen_time_trend = models.CharField(
        max_length=20, 
        choices=[('increasing', 'Increasing'), ('decreasing', 'Decreasing'), ('stable', 'Stable')],
        default='stable'
    )
    activity_growth_percentage = models.FloatField(default=0.0)
    
    # Top Categories
    top_learning_category = models.CharField(max_length=100, blank=True)
    most_used_app = models.CharField(max_length=100, blank=True)
    
    # Additional Metrics
    engagement_rating = models.CharField(
        max_length=20,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='medium'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'week_start_date']
        ordering = ['-week_start_date']

    def __str__(self):
        return f"{self.child.name} - Week {self.week_start_date}"


class MonthlyReport(models.Model):
    """Monthly summary report"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='monthly_reports')
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    
    # Monthly Totals
    total_screen_time_hours = models.FloatField(default=0.0)
    total_videos_watched = models.IntegerField(default=0)
    total_goals_achieved = models.IntegerField(default=0)
    
    # Averages
    avg_daily_screen_time_minutes = models.IntegerField(default=0)
    avg_engagement_score = models.FloatField(default=0.0)
    
    # Achievements
    best_day_date = models.DateField(blank=True, null=True)
    longest_learning_streak = models.IntegerField(default=0)
    
    # Categories
    learning_categories_breakdown = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.child.name} - {self.month}/{self.year}"


class Recommendation(models.Model):
    """AI-generated or rule-based recommendations"""
    CATEGORY_CHOICES = [
        ('screen_time', 'Screen Time'),
        ('learning', 'Learning'),
        ('creativity', 'Creativity'),
        ('physical', 'Physical Activity'),
        ('social', 'Social Skills'),
        ('general', 'General'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='recommendations')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    icon_name = models.CharField(max_length=50, default='bulb-outline', help_text="Ionicons name")
    
    # Tracking
    is_active = models.BooleanField(default=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    based_on_data = models.JSONField(default=dict, help_text="Data that generated this recommendation")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.child.name} - {self.title}"


class ExportedReport(models.Model):
    """Track exported PDF reports"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='exported_reports')
    report_type = models.CharField(
        max_length=20,
        choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('custom', 'Custom')],
        default='weekly'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    
    file_path = models.CharField(max_length=500, blank=True)
    file_name = models.CharField(max_length=200)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.child.name} - {self.report_type} - {self.start_date}"