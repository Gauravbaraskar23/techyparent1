from django.contrib import admin
from .models import (
    ActivityCategory,
    FamilyActivity,
    ActivityRating,
    FamilyMemory,
    MemoryComment,
    ActivityTemplate,
    BondingStreak,
    FamilyChallenge,
    QualityTimeStats,
    FamilyMilestone,
)


# ============================================================
# CATEGORY
# ============================================================
@admin.register(ActivityCategory)
class ActivityCategoryAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'name', 'color', 'order')
    search_fields = ('display_name', 'name')
    list_editable = ('order',)


# ============================================================
# FAMILY ACTIVITY
# ============================================================
@admin.register(FamilyActivity)
class FamilyActivityAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'parent', 'category', 'scheduled_date',
        'status', 'difficulty', 'is_outdoor'
    )
    list_filter = ('status', 'difficulty', 'is_outdoor', 'category')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'scheduled_date'
    filter_horizontal = ('children',)


# ============================================================
# ACTIVITY RATING
# ============================================================
@admin.register(ActivityRating)
class ActivityRatingAdmin(admin.ModelAdmin):
    list_display = ('activity', 'child', 'rating', 'fun_level', 'favorite')
    list_filter = ('rating', 'favorite', 'would_do_again')
    search_fields = ('activity__title', 'child__name')


# ============================================================
# FAMILY MEMORY
# ============================================================
@admin.register(FamilyMemory)
class FamilyMemoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'activity', 'memory_date', 'created_by')
    search_fields = ('title', 'description')
    list_filter = ('memory_date',)
    date_hierarchy = 'memory_date'


# ============================================================
# MEMORY COMMENTS
# ============================================================
@admin.register(MemoryComment)
class MemoryCommentAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'memory', 'created_at')
    search_fields = ('author_name', 'comment')


# ============================================================
# ACTIVITY TEMPLATE
# ============================================================
@admin.register(ActivityTemplate)
class ActivityTemplateAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'category', 'difficulty',
        'duration_minutes', 'is_outdoor', 'is_popular'
    )
    list_filter = ('category', 'difficulty', 'is_outdoor', 'is_popular')
    search_fields = ('title', 'description')
    list_editable = ('is_popular',)


# ============================================================
# BONDING STREAK
# ============================================================
@admin.register(BondingStreak)
class BondingStreakAdmin(admin.ModelAdmin):
    list_display = (
        'parent', 'current_streak', 'longest_streak',
        'total_activities', 'total_hours'
    )


# ============================================================
# FAMILY CHALLENGE
# ============================================================
@admin.register(FamilyChallenge)
class FamilyChallengeAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'parent', 'status',
        'start_date', 'end_date',
        'activities_completed'
    )
    list_filter = ('status',)
    search_fields = ('title', 'description')
    filter_horizontal = ('children',)


# ============================================================
# QUALITY TIME STATS
# ============================================================
@admin.register(QualityTimeStats)
class QualityTimeStatsAdmin(admin.ModelAdmin):
    list_display = (
        'parent', 'week_start', 'week_end',
        'total_activities', 'total_hours'
    )
    list_filter = ('week_start',)


# ============================================================
# FAMILY MILESTONE
# ============================================================
@admin.register(FamilyMilestone)
class FamilyMilestoneAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'parent', 'milestone_type',
        'value', 'achieved_at'
    )
    list_filter = ('milestone_type',)
    search_fields = ('title',)