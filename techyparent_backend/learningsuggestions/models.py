from django.db import models
from api.models import Child

CATEGORY_CHOICES = [
    ("education", "Education"),
    ("creativity", "Creativity"),
    ("devotional", "Devotional"),
    ("motivational", "Motivational"),
]

class LearningVideo(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    age_min = models.IntegerField(default=3)
    age_max = models.IntegerField(default=17)
    video_url = models.URLField()
    thumbnail_url = models.URLField(blank=True)

    def __str__(self):
        return f"{self.title} ({self.category})"


class ChildLearningProgress(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="learning_progress")
    video = models.ForeignKey(LearningVideo, on_delete=models.CASCADE, related_name="child_progress")
    watched = models.BooleanField(default=False)
    liked = models.BooleanField(default=False)
    added_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.child.name} - {self.video.title}"
