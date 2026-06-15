from rest_framework import serializers
from .models import DailyReport, WeeklyReport, MonthlyReport, Recommendation, ExportedReport
from django.utils import timezone


class DailyReportSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    screen_time_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyReport
        fields = [
            'id', 'child', 'child_name', 'date',
            'total_screen_time_minutes', 'screen_time_hours',
            'apps_used_count', 'most_used_app',
            'videos_watched', 'learning_time_minutes', 'learning_categories',
            'goals_achieved', 'goals_in_progress',
            'engagement_score', 'activity_change_percentage',
            'created_at', 'updated_at'
        ]
    
    def get_screen_time_hours(self, obj):
        """Convert minutes to hours for display"""
        hours = obj.total_screen_time_minutes / 60
        return round(hours, 1)


class WeeklyReportSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    avg_screen_time_hours = serializers.SerializerMethodField()
    week_label = serializers.SerializerMethodField()
    
    class Meta:
        model = WeeklyReport
        fields = [
            'id', 'child', 'child_name', 
            'week_start_date', 'week_end_date', 'week_label',
            'avg_daily_screen_time_minutes', 'avg_screen_time_hours',
            'total_videos_watched', 'total_goals_achieved',
            'screen_time_trend', 'activity_growth_percentage',
            'top_learning_category', 'most_used_app',
            'engagement_rating',
            'created_at'
        ]
    
    def get_avg_screen_time_hours(self, obj):
        hours = obj.avg_daily_screen_time_minutes / 60
        return round(hours, 1)
    
    def get_week_label(self, obj):
        return f"{obj.week_start_date.strftime('%b %d')} - {obj.week_end_date.strftime('%b %d')}"


class MonthlyReportSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    month_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthlyReport
        fields = [
            'id', 'child', 'child_name',
            'month', 'year', 'month_name',
            'total_screen_time_hours', 'total_videos_watched', 'total_goals_achieved',
            'avg_daily_screen_time_minutes', 'avg_engagement_score',
            'best_day_date', 'longest_learning_streak',
            'learning_categories_breakdown',
            'created_at'
        ]
    
    def get_month_name(self, obj):
        from datetime import date
        return date(obj.year, obj.month, 1).strftime('%B %Y')


class RecommendationSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    
    class Meta:
        model = Recommendation
        fields = [
            'id', 'child', 'child_name',
            'title', 'description', 'category', 'priority',
            'icon_name', 'is_active', 'is_completed',
            'completed_at', 'based_on_data',
            'created_at'
        ]


class ExportedReportSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    
    class Meta:
        model = ExportedReport
        fields = [
            'id', 'child', 'child_name',
            'report_type', 'start_date', 'end_date',
            'file_path', 'file_name',
            'created_at'
        ]


class ReportSummarySerializer(serializers.Serializer):
    """Serializer for the main report screen summary"""
    # Summary Cards
    screen_time_today = serializers.CharField()
    videos_watched_total = serializers.IntegerField()
    goals_achieved_total = serializers.IntegerField()
    
    # Activity Overview
    daily_activity_change = serializers.FloatField()
    engagement_level = serializers.CharField()
    engagement_category = serializers.CharField()
    
    # Weekly Chart Data
    weekly_data = serializers.ListField()
    
    # Recommendations
    recommendations = RecommendationSerializer(many=True)


class ProgressChartDataSerializer(serializers.Serializer):
    """Serializer for chart data"""
    date = serializers.DateField()
    label = serializers.CharField()
    screen_time_minutes = serializers.IntegerField()
    videos_watched = serializers.IntegerField()
    engagement_score = serializers.FloatField()