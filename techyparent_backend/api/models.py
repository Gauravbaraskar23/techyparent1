from django.db import models
from django.contrib.auth.models import User

class Parent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Child(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='children')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    avatar = models.URLField(blank=True, null=True)
    online = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Activity(models.Model):
    """Track daily activity summary for analytics"""
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='activities')
    screen_time = models.FloatField(help_text="Hours of screen time", default=0)
    goals_completed = models.IntegerField(default=0)
    goals_total = models.IntegerField(default=0)
    learning_time = models.FloatField(help_text="Hours spent learning", default=0)
    routine_completed = models.BooleanField(default=False)
    family_activities = models.IntegerField(default=0, help_text="Family bonding activities count")
    date = models.DateField()

    def __str__(self):
        return f"{self.child.name} - {self.date}"

    class Meta:
        ordering = ['-date']
        unique_together = ['child', 'date']