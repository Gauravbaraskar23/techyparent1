# familybonding/models.py
# Complete Family Bonding Module

from django.db import models
from django.utils import timezone
from api.models import Child, Parent


class ActivityCategory(models.Model):
    """Categories for family activities"""
    CATEGORY_CHOICES = [
        ('outdoor', 'Outdoor Activities'),
        ('indoor', 'Indoor Games'),
        ('creative', 'Creative & Arts'),
        ('educational', 'Educational'),
        ('sports', 'Sports & Fitness'),
        ('cooking', 'Cooking Together'),
        ('movie', 'Movie & Entertainment'),
        ('travel', 'Travel & Exploration'),
        ('volunteer', 'Volunteering'),
        ('celebration', 'Celebrations'),
    ]

    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, default='people-outline')
    color = models.CharField(max_length=7, default='#EC4899')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name_plural = 'Activity Categories'

    def __str__(self):
        return self.display_name


class FamilyActivity(models.Model):
    """Planned or completed family activities"""
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('challenging', 'Challenging'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(ActivityCategory, on_delete=models.SET_NULL, null=True, related_name='activities')
    
    # Participants
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='family_activities')
    children = models.ManyToManyField(Child, related_name='family_activities')
    
    # Scheduling
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=60)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    difficulty = models.CharField(max_length=15, choices=DIFFICULTY_CHOICES, default='easy')
    
    # Location
    location = models.CharField(max_length=200, blank=True)
    is_outdoor = models.BooleanField(default=False)
    
    # Details
    materials_needed = models.TextField(blank=True, help_text="List of materials/items needed")
    preparation_time = models.IntegerField(default=0, help_text="Preparation time in minutes")
    cost_estimate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Media
    photo_url = models.URLField(blank=True)
    
    # Reminder
    reminder_enabled = models.BooleanField(default=True)
    reminder_minutes_before = models.IntegerField(default=60)
    
    # Completion
    completed_at = models.DateTimeField(null=True, blank=True)
    actual_duration_minutes = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_date', 'scheduled_time']
        verbose_name_plural = 'Family Activities'

    def __str__(self):
        return f"{self.title} - {self.scheduled_date}"

    def mark_completed(self, actual_duration=None):
        """Mark activity as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if actual_duration:
            self.actual_duration_minutes = actual_duration
        self.save()


class ActivityRating(models.Model):
    """Ratings and feedback for completed activities"""
    activity = models.ForeignKey(FamilyActivity, on_delete=models.CASCADE, related_name='ratings')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='activity_ratings')
    
    rating = models.IntegerField(choices=[(1, '⭐'), (2, '⭐⭐'), (3, '⭐⭐⭐'), (4, '⭐⭐⭐⭐'), (5, '⭐⭐⭐⭐⭐')])
    favorite = models.BooleanField(default=False, help_text="Mark as favorite activity")
    would_do_again = models.BooleanField(default=True)
    
    feedback = models.TextField(blank=True)
    fun_level = models.IntegerField(choices=[(1, 'Not Fun'), (2, 'Okay'), (3, 'Fun'), (4, 'Very Fun'), (5, 'Super Fun')], default=3)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['activity', 'child']

    def __str__(self):
        return f"{self.child.name} - {self.activity.title} ({self.rating}⭐)"


class FamilyMemory(models.Model):
    """Special memories from family activities"""
    activity = models.ForeignKey(FamilyActivity, on_delete=models.CASCADE, related_name='memories')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    memory_date = models.DateField(default=timezone.now)
    
    # Media
    photo_urls = models.JSONField(default=list, help_text="List of photo URLs")
    video_url = models.URLField(blank=True)
    
    # Tags
    tags = models.JSONField(default=list, help_text="Tags like ['birthday', 'first time', 'achievement']")
    
    # Reactions
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(Parent, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-memory_date']
        verbose_name_plural = 'Family Memories'

    def __str__(self):
        return f"{self.title} - {self.memory_date}"


class MemoryComment(models.Model):
    """Comments on family memories"""
    memory = models.ForeignKey(FamilyMemory, on_delete=models.CASCADE, related_name='comments')
    author_name = models.CharField(max_length=100)
    author_type = models.CharField(max_length=10, choices=[('parent', 'Parent'), ('child', 'Child')])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author_name} on {self.memory.title}"


class ActivityTemplate(models.Model):
    """Pre-made activity templates for quick planning"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(ActivityCategory, on_delete=models.CASCADE, related_name='templates')
    
    difficulty = models.CharField(max_length=15, default='easy')
    duration_minutes = models.IntegerField(default=60)
    age_range = models.CharField(max_length=50, default='All ages')
    
    materials_needed = models.TextField(blank=True)
    instructions = models.TextField()
    
    is_outdoor = models.BooleanField(default=False)
    cost_estimate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Popularity
    times_used = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    is_popular = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_popular', '-times_used']

    def __str__(self):
        return self.title


class BondingStreak(models.Model):
    """Track family bonding streaks"""
    parent = models.OneToOneField(Parent, on_delete=models.CASCADE, related_name='bonding_streak')
    
    current_streak = models.IntegerField(default=0, help_text="Consecutive weeks with activities")
    longest_streak = models.IntegerField(default=0)
    
    total_activities = models.IntegerField(default=0)
    total_hours = models.IntegerField(default=0)
    
    last_activity_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.parent.user.username} - {self.current_streak} week streak"

    def update_streak(self):
        """Update streak based on recent activities"""
        today = timezone.now().date()
        
        if self.last_activity_date:
            days_diff = (today - self.last_activity_date).days
            
            if days_diff <= 7:
                # Within a week - continue streak
                self.current_streak += 1
                if self.current_streak > self.longest_streak:
                    self.longest_streak = self.current_streak
            else:
                # Streak broken
                self.current_streak = 1
        else:
            # First activity
            self.current_streak = 1
        
        self.last_activity_date = today
        self.save()


class FamilyChallenge(models.Model):
    """Weekly/monthly family challenges"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Target
    target_activities = models.IntegerField(default=3, help_text="Number of activities to complete")
    target_hours = models.IntegerField(default=5, help_text="Total hours to spend together")
    
    # Participants
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='family_challenges')
    children = models.ManyToManyField(Child, related_name='family_challenges')
    
    # Progress
    activities_completed = models.IntegerField(default=0)
    hours_completed = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Reward
    reward_description = models.CharField(max_length=200, blank=True)
    reward_points = models.IntegerField(default=100)
    
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.title} ({self.start_date} - {self.end_date})"

    def check_completion(self):
        """Check if challenge is completed"""
        if (self.activities_completed >= self.target_activities and 
            self.hours_completed >= self.target_hours):
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save()
            return True
        return False


class QualityTimeStats(models.Model):
    """Weekly/monthly statistics for quality time"""
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='quality_time_stats')
    week_start = models.DateField()
    week_end = models.DateField()
    
    total_activities = models.IntegerField(default=0)
    total_hours = models.FloatField(default=0.0)
    
    indoor_activities = models.IntegerField(default=0)
    outdoor_activities = models.IntegerField(default=0)
    
    # Category breakdown
    category_breakdown = models.JSONField(default=dict, help_text="Activity count per category")
    
    # Average ratings
    average_rating = models.FloatField(default=0.0)
    average_fun_level = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-week_start']
        unique_together = ['parent', 'week_start']
        verbose_name_plural = 'Quality Time Stats'

    def __str__(self):
        return f"{self.parent.user.username} - Week of {self.week_start}"


class FamilyMilestone(models.Model):
    """Special family milestones and achievements"""
    MILESTONE_TYPES = [
        ('activity_count', 'Activity Count'),
        ('streak', 'Streak Achievement'),
        ('hours', 'Hours Together'),
        ('special', 'Special Occasion'),
    ]

    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='family_milestones')
    milestone_type = models.CharField(max_length=20, choices=MILESTONE_TYPES)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    value = models.IntegerField(default=0, help_text="Milestone value (100 activities, 10 week streak, etc)")
    achieved_at = models.DateTimeField(auto_now_add=True)
    
    icon_name = models.CharField(max_length=50, default='trophy-outline')
    color = models.CharField(max_length=7, default='#F59E0B')

    class Meta:
        ordering = ['-achieved_at']

    def __str__(self):
        return f"{self.title} - {self.parent.user.username}"