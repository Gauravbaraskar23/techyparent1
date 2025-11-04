from django.contrib import admin
from .models import Parent , Child , Activity
# Register your models here.

class ParentAdmin(admin.ModelAdmin):
    list_display = ['name' , 'email']

class ChildAdmin(admin.ModelAdmin):
    list_display = ['parent' , 'name' , 'age' ,'online']

class ActivityAdmin(admin.ModelAdmin):
    list_display = ['child' , 'screen_time' , 'goals_completed' ,'goals_total' , 'restrictions' ]


admin.site.register(Parent , ParentAdmin)
admin.site.register(Child, ChildAdmin)
admin.site.register(Activity , ActivityAdmin)