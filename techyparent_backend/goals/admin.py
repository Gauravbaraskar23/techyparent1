from django.contrib import admin
from .models import Goal
# Register your models here.

# @admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['child','title','description' , 'completed']


admin.site.register(Goal , GoalAdmin)
