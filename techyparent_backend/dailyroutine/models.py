from django.db import models
from django.utils import timezone
from api.models import Child


class VoiceCommand(models.Model):
    """Store voice commands and responses"""
    COMMAND_TYPES = [
        ('completion', 'Activity Completion'),
        ('query', 'Status Query'),
        ('skip', 'Skip Activity'),
        ('snooze', 'Snooze Reminder'),
        ('help', 'Help Request'),
    ]
    
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='voice_commands')
    activity = models.ForeignKey('RoutineActivity', on_delete=models.SET_NULL, null=True, blank=True)
    
    command_type = models.CharField(max_length=20, choices=COMMAND_TYPES)
    spoken_text = models.TextField(help_text="What the child said")
    interpreted_action = models.CharField(max_length=200, help_text="What system understood")
    confidence_score = models.FloatField(default=0.0, help_text="0-1 confidence in recognition")
    
    was_successful = models.BooleanField(default=False)
    response_text = models.TextField(help_text="What assistant said back")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.child.name} - {self.command_type} - {self.spoken_text[:50]}"


class VoiceSettings(models.Model):
    """Voice assistant settings per child"""
    VOICE_TYPES = [
        ('male', 'Male Voice'),
        ('female', 'Female Voice'),
        ('child', 'Child Voice'),
        ('robot', 'Robot Voice'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en-US', 'English (US)'),
        ('en-GB', 'English (UK)'),
        ('hi-IN', 'Hindi'),
        ('es-ES', 'Spanish'),
    ]
    
    child = models.OneToOneField(Child, on_delete=models.CASCADE, related_name='voice_settings')
    
    # Voice Settings
    voice_type = models.CharField(max_length=20, choices=VOICE_TYPES, default='female')
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en-US')
    speech_rate = models.FloatField(default=1.0, help_text="0.5 to 2.0")
    pitch = models.FloatField(default=1.0, help_text="0.5 to 2.0")
    volume = models.FloatField(default=1.0, help_text="0.0 to 1.0")
    
    # Notification Settings
    speak_reminders = models.BooleanField(default=True)
    speak_completions = models.BooleanField(default=True)
    speak_encouragement = models.BooleanField(default=True)
    
    # Voice Recognition
    enable_voice_commands = models.BooleanField(default=True)
    require_wake_word = models.BooleanField(default=False)
    wake_word = models.CharField(max_length=50, default='Hey Techy')
    
    # Reminders
    reminder_minutes_before = models.IntegerField(default=5)
    reminder_sound_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.child.name} - Voice Settings"


class ActivityPhrase(models.Model):
    """Custom phrases for activities"""
    activity = models.ForeignKey('RoutineActivity', on_delete=models.CASCADE, related_name='phrases')
    
    # What assistant says
    start_phrase = models.TextField(
        default="It's time for {activity}!",
        help_text="Spoken when activity starts. Use {activity} for activity name."
    )
    reminder_phrase = models.TextField(
        default="Don't forget about {activity} in {minutes} minutes!",
        help_text="Use {activity} and {minutes}"
    )
    completion_phrase = models.TextField(
        default="Great job completing {activity}! ⭐",
        help_text="Spoken when marked complete"
    )
    encouragement_phrase = models.TextField(
        default="You're doing great! Keep it up!",
        help_text="Random encouragement during activity"
    )
    
    # Recognition patterns (what child might say)
    completion_keywords = models.JSONField(
        default=list,
        help_text="Keywords that indicate completion, e.g., ['done', 'finished', 'completed']"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Phrases for {self.activity.title}"


class VoiceNotification(models.Model):
    """Track voice notifications sent"""
    NOTIFICATION_TYPES = [
        ('reminder', 'Reminder'),
        ('start', 'Activity Start'),
        ('completion', 'Completion Confirmation'),
        ('encouragement', 'Encouragement'),
        ('warning', 'Warning/Alert'),
    ]
    
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='voice_notifications')
    activity = models.ForeignKey('RoutineActivity', on_delete=models.SET_NULL, null=True, blank=True)
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    spoken_text = models.TextField()
    
    was_spoken = models.BooleanField(default=False)
    spoken_at = models.DateTimeField(null=True, blank=True)
    
    # User interaction
    user_responded = models.BooleanField(default=False)
    response_text = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} - {self.spoken_text[:50]}"


class SmartSuggestion(models.Model):
    """AI-powered suggestions based on patterns"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='smart_suggestions')
    
    suggestion_type = models.CharField(
        max_length=50,
        choices=[
            ('time_adjustment', 'Adjust Activity Time'),
            ('skip_activity', 'Consider Skipping'),
            ('add_break', 'Add Break Time'),
            ('motivation', 'Needs Motivation'),
        ]
    )
    
    suggestion_text = models.TextField()
    activity = models.ForeignKey('RoutineActivity', on_delete=models.SET_NULL, null=True, blank=True)
    
    based_on_data = models.JSONField(default=dict, help_text="Pattern data that led to this suggestion")
    confidence_score = models.FloatField(default=0.0)
    
    is_active = models.BooleanField(default=True)
    is_accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.child.name} - {self.suggestion_type}"


# Keep existing models from previous version
class RoutineCategory(models.Model):
    """Categories for routine activities"""
    CATEGORY_CHOICES = [
        ('morning', 'Morning Routine'),
        ('school', 'School Time'),
        ('afternoon', 'Afternoon'),
        ('evening', 'Evening'),
        ('night', 'Night Routine'),
        ('meals', 'Meals'),
        ('play', 'Play Time'),
        ('study', 'Study Time'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    icon_name = models.CharField(max_length=50, default='time-outline')
    color = models.CharField(max_length=7, default='#3b82f6')
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        verbose_name_plural = 'Routine Categories'
    
    def __str__(self):
        return self.display_name


class DailyRoutine(models.Model):
    """Main daily routine for a child"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='daily_routines')
    title = models.CharField(max_length=200, default="My Daily Routine")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', '-created_at']
    
    def __str__(self):
        return f"{self.child.name} - {self.title}"
    
    def get_total_activities(self):
        return self.activities.count()
    
    def get_completed_today(self):
        today = timezone.now().date()
        return RoutineCompletion.objects.filter(
            activity__routine=self,
            date=today,
            is_completed=True
        ).count()
    
    def get_completion_percentage_today(self):
        total = self.get_total_activities()
        if total == 0:
            return 0
        completed = self.get_completed_today()
        return int((completed / total) * 100)


class RoutineActivity(models.Model):
    """Individual activity in a routine"""
    routine = models.ForeignKey(DailyRoutine, on_delete=models.CASCADE, related_name='activities')
    category = models.ForeignKey(RoutineCategory, on_delete=models.SET_NULL, null=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField(default=15)
    
    is_recurring = models.BooleanField(default=True)
    specific_days = models.JSONField(default=list, blank=True)
    
    reminder_enabled = models.BooleanField(default=True)
    reminder_minutes_before = models.IntegerField(default=5)
    
    icon_name = models.CharField(max_length=50, default='time-outline')
    color = models.CharField(max_length=7, default='#3b82f6')
    
    is_mandatory = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Voice integration
    custom_voice_enabled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'scheduled_time']
        unique_together = ['routine', 'scheduled_time', 'title']
    
    def __str__(self):
        return f"{self.title} at {self.scheduled_time.strftime('%I:%M %p')}"
    
    def is_for_today(self):
        if self.is_recurring and not self.specific_days:
            return True
        today = timezone.now().strftime('%A').lower()
        return today in self.specific_days
    
    def get_end_time(self):
        from datetime import datetime, timedelta
        start = datetime.combine(timezone.now().date(), self.scheduled_time)
        end = start + timedelta(minutes=self.duration_minutes)
        return end.time()
    
    def is_completed_today(self):
        today = timezone.now().date()
        return RoutineCompletion.objects.filter(
            activity=self,
            date=today,
            is_completed=True
        ).exists()


class RoutineCompletion(models.Model):
    """Track completion of routine activities"""
    activity = models.ForeignKey(RoutineActivity, on_delete=models.CASCADE, related_name='completions')
    date = models.DateField(default=timezone.now)
    
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Voice completion tracking
    completed_via_voice = models.BooleanField(default=False)
    voice_command = models.ForeignKey(VoiceCommand, on_delete=models.SET_NULL, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    was_on_time = models.BooleanField(default=True)
    difficulty_rating = models.IntegerField(
        null=True, 
        blank=True,
        choices=[(1, 'Easy'), (2, 'Medium'), (3, 'Hard')]
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['activity', 'date']
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        status = "✓" if self.is_completed else "✗"
        return f"{status} {self.activity.title} - {self.date}"
    
    def mark_complete(self, via_voice=False, voice_command=None):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.completed_via_voice = via_voice
        if voice_command:
            self.voice_command = voice_command
        self.save()
    
    def mark_incomplete(self):
        self.is_completed = False
        self.completed_at = None
        self.save()


class RoutineTemplate(models.Model):
    """Pre-built routine templates parents can apply quickly"""
    AGE_GROUP_CHOICES = [
        ('toddler', '1-3 years'),
        ('preschool', '4-5 years'),
        ('elementary', '6-10 years'),
        ('preteen', '11-13 years'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    age_group = models.CharField(max_length=20, choices=AGE_GROUP_CHOICES)
    activities_data = models.JSONField(help_text="List of activity definitions for this template")
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['age_group', 'name']

    def __str__(self):
        return f"{self.name} ({self.age_group})"
# from django.db import models
# from django.utils import timezone
# from api.models import Child


# class RoutineCategory(models.Model):
#     """Categories for routine activities"""
#     CATEGORY_CHOICES = [
#         ('morning', 'Morning Routine'),
#         ('school', 'School Time'),
#         ('afternoon', 'Afternoon'),
#         ('evening', 'Evening'),
#         ('night', 'Night Routine'),
#         ('meals', 'Meals'),
#         ('play', 'Play Time'),
#         ('study', 'Study Time'),
#         ('other', 'Other'),
#     ]
    
#     name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
#     display_name = models.CharField(max_length=100)
#     icon_name = models.CharField(max_length=50, default='time-outline', help_text="Ionicons name")
#     color = models.CharField(max_length=7, default='#3b82f6', help_text="Hex color code")
#     order = models.IntegerField(default=0)
    
#     class Meta:
#         ordering = ['order']
#         verbose_name_plural = 'Routine Categories'
    
#     def __str__(self):
#         return self.display_name


# class DailyRoutine(models.Model):
#     """Main daily routine for a child"""
#     child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='daily_routines')
#     title = models.CharField(max_length=200, default="My Daily Routine")
#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['-is_active', '-created_at']
    
#     def __str__(self):
#         return f"{self.child.name} - {self.title}"
    
#     def get_total_activities(self):
#         """Get total number of activities"""
#         return self.activities.count()
    
#     def get_completed_today(self):
#         """Get number of activities completed today"""
#         today = timezone.now().date()
#         return RoutineCompletion.objects.filter(
#             activity__routine=self,
#             date=today,
#             is_completed=True
#         ).count()
    
#     def get_completion_percentage_today(self):
#         """Calculate completion percentage for today"""
#         total = self.get_total_activities()
#         if total == 0:
#             return 0
#         completed = self.get_completed_today()
#         return int((completed / total) * 100)


# class RoutineActivity(models.Model):
#     """Individual activity in a routine"""
#     WEEKDAY_CHOICES = [
#         ('monday', 'Monday'),
#         ('tuesday', 'Tuesday'),
#         ('wednesday', 'Wednesday'),
#         ('thursday', 'Thursday'),
#         ('friday', 'Friday'),
#         ('saturday', 'Saturday'),
#         ('sunday', 'Sunday'),
#     ]
    
#     routine = models.ForeignKey(DailyRoutine, on_delete=models.CASCADE, related_name='activities')
#     category = models.ForeignKey(RoutineCategory, on_delete=models.SET_NULL, null=True, related_name='activities')
    
#     title = models.CharField(max_length=200, help_text="e.g., Wake up, Brush teeth")
#     description = models.TextField(blank=True, help_text="Additional details or instructions")
    
#     # Time settings
#     scheduled_time = models.TimeField(help_text="What time should this happen?")
#     duration_minutes = models.IntegerField(default=15, help_text="Estimated duration in minutes")
    
#     # Recurrence
#     is_recurring = models.BooleanField(default=True, help_text="Repeats daily?")
#     specific_days = models.JSONField(
#         default=list, 
#         blank=True,
#         help_text="Specific weekdays if not daily, e.g., ['monday', 'wednesday']"
#     )
    
#     # Reminders
#     reminder_enabled = models.BooleanField(default=True)
#     reminder_minutes_before = models.IntegerField(default=10, help_text="Remind X minutes before")
    
#     # Visual
#     icon_name = models.CharField(max_length=50, default='time-outline', help_text="Ionicons name")
#     color = models.CharField(max_length=7, default='#3b82f6', help_text="Hex color code")
    
#     # Settings
#     is_mandatory = models.BooleanField(default=False, help_text="Must be completed?")
#     order = models.IntegerField(default=0, help_text="Order in the routine")
#     is_active = models.BooleanField(default=True)
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['order', 'scheduled_time']
#         unique_together = ['routine', 'scheduled_time', 'title']
    
#     def __str__(self):
#         return f"{self.title} at {self.scheduled_time.strftime('%I:%M %p')}"
    
#     def is_for_today(self):
#         """Check if this activity is scheduled for today"""
#         if self.is_recurring and not self.specific_days:
#             return True
        
#         today = timezone.now().strftime('%A').lower()
#         return today in self.specific_days
    
#     def get_end_time(self):
#         """Calculate end time based on duration"""
#         from datetime import datetime, timedelta
#         start = datetime.combine(timezone.now().date(), self.scheduled_time)
#         end = start + timedelta(minutes=self.duration_minutes)
#         return end.time()
    
#     def is_completed_today(self):
#         """Check if completed today"""
#         today = timezone.now().date()
#         return RoutineCompletion.objects.filter(
#             activity=self,
#             date=today,
#             is_completed=True
#         ).exists()


# class RoutineCompletion(models.Model):
#     """Track completion of routine activities"""
#     activity = models.ForeignKey(RoutineActivity, on_delete=models.CASCADE, related_name='completions')
#     date = models.DateField(default=timezone.now)
    
#     is_completed = models.BooleanField(default=False)
#     completed_at = models.DateTimeField(null=True, blank=True)
    
#     # Optional feedback
#     notes = models.TextField(blank=True, help_text="Parent/child notes")
#     was_on_time = models.BooleanField(default=True, help_text="Was it done on time?")
#     difficulty_rating = models.IntegerField(
#         null=True, 
#         blank=True,
#         choices=[(1, 'Easy'), (2, 'Medium'), (3, 'Hard')],
#         help_text="How difficult was this activity?"
#     )
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         unique_together = ['activity', 'date']
#         ordering = ['-date', '-created_at']
    
#     def __str__(self):
#         status = "✓" if self.is_completed else "✗"
#         return f"{status} {self.activity.title} - {self.date}"
    
#     def mark_complete(self):
#         """Mark as completed"""
#         self.is_completed = True
#         self.completed_at = timezone.now()
#         self.save()
    
#     def mark_incomplete(self):
#         """Mark as incomplete"""
#         self.is_completed = False
#         self.completed_at = None
#         self.save()


# class RoutineTemplate(models.Model):
#     """Pre-defined routine templates"""
#     name = models.CharField(max_length=200)
#     description = models.TextField()
#     age_group = models.CharField(
#         max_length=20,
#         choices=[
#             ('toddler', '1-3 years'),
#             ('preschool', '4-5 years'),
#             ('elementary', '6-10 years'),
#             ('preteen', '11-13 years'),
#         ]
#     )
#     activities_data = models.JSONField(help_text="Template activities structure")
#     is_public = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         ordering = ['age_group', 'name']
    
#     def __str__(self):
#         return f"{self.name} ({self.age_group})"


# class RoutineReminder(models.Model):
#     """Reminders for routine activities"""
#     activity = models.ForeignKey(RoutineActivity, on_delete=models.CASCADE, related_name='reminders')
#     reminder_time = models.DateTimeField()
#     was_sent = models.BooleanField(default=False)
#     sent_at = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         ordering = ['reminder_time']
    
#     def __str__(self):
#         return f"Reminder for {self.activity.title} at {self.reminder_time}"