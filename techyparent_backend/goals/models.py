
from django.db import models
from django.utils import timezone
from api.models import Child
from datetime import timedelta


class GoalCategory(models.Model):
    """Categories for different types of goals"""
    CATEGORY_CHOICES = [
        ('academic', 'Academic'),
        ('health', 'Health & Fitness'),
        ('hobby', 'Hobby & Skills'),
        ('social', 'Social & Behavior'),
        ('reading', 'Reading'),
        ('chores', 'Chores & Responsibilities'),
        ('screen_time', 'Screen Time'),
        ('creative', 'Creative'),
        ('personal', 'Personal Growth'),
    ]

    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, default='flag-outline')
    color = models.CharField(max_length=7, default='#3b82f6')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name_plural = 'Goal Categories'

    def __str__(self):
        return self.display_name


class Goal(models.Model):
    """Main goal model"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom'),
        ('one_time', 'One Time'),
    ]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='goals')
    category = models.ForeignKey(GoalCategory, on_delete=models.SET_NULL, null=True, related_name='goals')

    # Basic Info
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, default='flag-outline')
    color = models.CharField(max_length=7, default='#3b82f6')

    # Status & Priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')

    # Target & Progress
    target_value = models.IntegerField(default=1, help_text="Target count/number")
    current_value = models.IntegerField(default=0, help_text="Current progress")
    unit = models.CharField(max_length=50, default='times', help_text="e.g., times, minutes, pages, km")

    # Frequency & Dates
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    # Reminder
    reminder_enabled = models.BooleanField(default=True)
    reminder_time = models.TimeField(null=True, blank=True)

    # Rewards & Motivation
    reward_points = models.IntegerField(default=10)
    reward_description = models.CharField(max_length=200, blank=True, help_text="What they get when completed")

    # Metadata
    is_collaborative = models.BooleanField(default=False, help_text="Can be done with friends/family")
    is_public = models.BooleanField(default=False, help_text="Visible to other family members")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.child.name} - {self.title}"

    def get_progress_percentage(self):
        """Calculate progress percentage"""
        if self.target_value == 0:
            return 0
        return min(100, int((self.current_value / self.target_value) * 100))

    def is_overdue(self):
        """Check if goal is overdue"""
        if self.end_date and self.status == 'active':
            return timezone.now().date() > self.end_date
        return False

    def mark_complete(self):
        """Mark goal as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.current_value = self.target_value
        self.save()

        # Award points
        from .models import ChildPoints
        points, created = ChildPoints.objects.get_or_create(child=self.child)
        points.total_points += self.reward_points
        points.save()

    def add_progress(self, value=1):
        """Add progress to goal"""
        self.current_value += value
        if self.current_value >= self.target_value:
            self.mark_complete()
        else:
            self.save()


class GoalMilestone(models.Model):
    """Milestones/checkpoints within a goal"""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    target_value = models.IntegerField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'target_value']

    def __str__(self):
        return f"{self.goal.title} - {self.title}"


class DailyGoalLog(models.Model):
    """Daily log for recurring goals"""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField(default=timezone.now)
    completed = models.BooleanField(default=False)
    value_achieved = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['goal', 'date']
        ordering = ['-date']

    def __str__(self):
        status = "✓" if self.completed else "✗"
        return f"{status} {self.goal.title} - {self.date}"


class GoalComment(models.Model):
    """Comments/notes on goals (from parent or child)"""
    AUTHOR_TYPES = [
        ('parent', 'Parent'),
        ('child', 'Child'),
    ]

    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='comments')
    author_type = models.CharField(max_length=10, choices=AUTHOR_TYPES)
    author_name = models.CharField(max_length=100)
    comment = models.TextField()
    is_encouragement = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_name} on {self.goal.title}"


class GoalTemplate(models.Model):
    """Pre-made goal templates"""
    category = models.ForeignKey(GoalCategory, on_delete=models.CASCADE, related_name='templates')
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon_name = models.CharField(max_length=50, default='flag-outline')
    color = models.CharField(max_length=7, default='#3b82f6')
    
    default_target = models.IntegerField(default=1)
    default_unit = models.CharField(max_length=50, default='times')
    default_frequency = models.CharField(max_length=20, default='daily')
    default_priority = models.CharField(max_length=10, default='medium')
    
    age_group = models.CharField(max_length=20, default='all')
    is_popular = models.BooleanField(default=False)
    times_used = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_popular', '-times_used']

    def __str__(self):
        return self.title


class ChildPoints(models.Model):
    """Total points earned by child from goals"""
    child = models.OneToOneField(Child, on_delete=models.CASCADE, related_name='goal_points')
    total_points = models.IntegerField(default=0)
    lifetime_points = models.IntegerField(default=0)  # Never resets
    level = models.IntegerField(default=1)
    points_to_next_level = models.IntegerField(default=100)
    
    # Streaks
    current_streak = models.IntegerField(default=0, help_text="Consecutive days with completed goals")
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.child.name} - {self.total_points} points (Level {self.level})"

    def add_points(self, points):
        """Add points and check for level up"""
        self.total_points += points
        self.lifetime_points += points
        
        # Check level up
        while self.total_points >= self.points_to_next_level:
            self.total_points -= self.points_to_next_level
            self.level += 1
            self.points_to_next_level = int(self.points_to_next_level * 1.5)  # Increase requirement
        
        self.save()

    def update_streak(self, completed_today=True):
        """Update streak counter"""
        today = timezone.now().date()
        
        if self.last_activity_date:
            days_diff = (today - self.last_activity_date).days
            
            if days_diff == 0:
                # Same day, do nothing
                return
            elif days_diff == 1:
                # Consecutive day
                if completed_today:
                    self.current_streak += 1
                    if self.current_streak > self.longest_streak:
                        self.longest_streak = self.current_streak
            else:
                # Streak broken
                self.current_streak = 1 if completed_today else 0
        else:
            # First activity
            self.current_streak = 1 if completed_today else 0
        
        self.last_activity_date = today
        self.save()


class GoalReminder(models.Model):
    """Scheduled reminders for goals"""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='reminders')
    scheduled_time = models.DateTimeField()
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    reminder_text = models.TextField()

    class Meta:
        ordering = ['scheduled_time']

    def __str__(self):
        return f"Reminder for {self.goal.title} at {self.scheduled_time}"


class CollaborativeGoal(models.Model):
    """Goals that multiple children work on together"""
    goal = models.OneToOneField(Goal, on_delete=models.CASCADE, related_name='collaboration')
    participants = models.ManyToManyField(Child, related_name='collaborative_goals')
    total_contribution = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Collaborative: {self.goal.title}"


class GoalContribution(models.Model):
    """Track individual contributions to collaborative goals"""
    collaborative_goal = models.ForeignKey(CollaborativeGoal, on_delete=models.CASCADE, related_name='contributions')
    child = models.ForeignKey(Child, on_delete=models.CASCADE)
    value_contributed = models.IntegerField(default=0)
    contribution_date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-contribution_date']

    def __str__(self):
        return f"{self.child.name} contributed {self.value_contributed} to {self.collaborative_goal.goal.title}"


class GoalBadge(models.Model):
    """Special badges earned from goals"""
    BADGE_TYPES = [
        ('streak', 'Streak Master'),
        ('completion', 'Goal Crusher'),
        ('early', 'Early Bird'),
        ('consistent', 'Consistency King'),
        ('collaborative', 'Team Player'),
        ('overachiever', 'Overachiever'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    badge_type = models.CharField(max_length=20, choices=BADGE_TYPES)
    icon_name = models.CharField(max_length=50, default='medal-outline')
    color = models.CharField(max_length=7, default='#f59e0b')
    requirement = models.IntegerField(default=1, help_text="Number needed to earn")
    points_reward = models.IntegerField(default=50)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class ChildGoalBadge(models.Model):
    """Badges earned by children"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='goal_badges')
    badge = models.ForeignKey(GoalBadge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    related_goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ['child', 'badge']
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.child.name} - {self.badge.name}"


class GoalAnalytics(models.Model):
    """Weekly/monthly analytics for goals"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='goal_analytics')
    week_start = models.DateField()
    week_end = models.DateField()
    
    total_goals = models.IntegerField(default=0)
    completed_goals = models.IntegerField(default=0)
    failed_goals = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)
    
    total_points_earned = models.IntegerField(default=0)
    most_active_category = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-week_start']
        unique_together = ['child', 'week_start']

    def __str__(self):
        return f"{self.child.name} - Week {self.week_start}"