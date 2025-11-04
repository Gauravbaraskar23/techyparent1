from django.db import models
from django.db import models
from api.models import Child

class Report(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='reports')
    summary = models.TextField()
    report_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Report for {self.child.name} - {self.report_date}"
