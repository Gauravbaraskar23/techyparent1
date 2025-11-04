from django.db import models
from api.models import Child  # assuming your Parent/Child models are in dashboard app

class ScreenTime(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='screen_times')
    date = models.DateField(auto_now_add=True)
    duration = models.FloatField(help_text="Screen time in hours")
    app_used = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.child.name} - {self.duration} hrs on {self.date}"
