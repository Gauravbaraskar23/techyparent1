from django.db import models

# Create your models here.
from django.db import models

class Parent(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.name

class Child(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='children')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    online = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Activity(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='activities')
    screen_time = models.FloatField(help_text="Hours of screen time")
    goals_completed = models.IntegerField()
    goals_total = models.IntegerField()
    restrictions = models.IntegerField()
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.child.name} - {self.date}"
