from django.contrib import admin
from .models import Parent, Child, Activity


# 🔹 Activity Inline (Child ke andar show hoga)
class ActivityInline(admin.TabularInline):
    model = Activity
    extra = 0
    readonly_fields = ('date',)


# 🔹 Child Inline (Parent ke andar show hoga)
class ChildInline(admin.TabularInline):
    model = Child
    extra = 0


# 🔹 Parent Admin
@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'phone', 'created_at')
    search_fields = ('name', 'email', 'phone')
    list_filter = ('created_at',)
    ordering = ('-created_at',)

    # Parent ke andar uske children dikhenge
    inlines = [ChildInline]


# 🔹 Child Admin
@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'age', 'gender', 'online', 'created_at')
    search_fields = ('name', 'parent__name')
    list_filter = ('gender', 'online', 'created_at')
    ordering = ('name',)

    # Child ke andar uski activities dikhenge
    inlines = [ActivityInline]


# 🔹 Activity Admin
@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'child',
        'screen_time',
        'goals_completed',
        'goals_total',
        'learning_time',
        'routine_completed',
        'date'
    )
    search_fields = ('child__name',)
    list_filter = ('date', 'routine_completed')
    ordering = ('-date',)

    # Readonly fields (optional but good)
    readonly_fields = ('date',)