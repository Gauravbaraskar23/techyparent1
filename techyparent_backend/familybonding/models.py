from django.db import models

class FamilyBondingCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='familybonding/categories/', blank=True, null=True)

    def __str__(self):
        return self.name


class FamilyActivity(models.Model):
    AGE_CHOICES = [
        ('3-7', 'Age 3–7'),
        ('8-12', 'Age 8–12'),
        ('13-17', 'Age 13–17'),
        ('all', 'All Ages'),
    ]

    category = models.ForeignKey(FamilyBondingCategory, on_delete=models.CASCADE, related_name='activities')
    title = models.CharField(max_length=200)
    description = models.TextField()
    age_group = models.CharField(max_length=10, choices=AGE_CHOICES, default='all')
    image = models.ImageField(upload_to='familybonding/activities/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    video_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.title
