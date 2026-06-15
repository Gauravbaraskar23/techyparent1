from rest_framework import serializers
from .models import ScreenTime, AppLimit, DailyScreenTimeSummary

class AppLimitSerializer(serializers.ModelSerializer):
    remaining_minutes = serializers.SerializerMethodField()
    used_today = serializers.SerializerMethodField()
    
    class Meta:
        model = AppLimit
        fields = [
            'id', 'child', 'app_name', 'app_package', 
            'daily_limit_minutes', 'is_blocked', 
            'remaining_minutes', 'used_today',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_remaining_minutes(self, obj):
        """Calculate remaining time for today"""
        from django.utils import timezone
        today = timezone.now().date()
        
        try:
            screen_time = ScreenTime.objects.get(
                child=obj.child,
                app_package=obj.app_package,
                date=today
            )
            remaining = obj.daily_limit_minutes - screen_time.duration_minutes
            return max(0, remaining)
        except ScreenTime.DoesNotExist:
            return obj.daily_limit_minutes

    def get_used_today(self, obj):
        """Get minutes used today"""
        from django.utils import timezone
        today = timezone.now().date()
        
        try:
            screen_time = ScreenTime.objects.get(
                child=obj.child,
                app_package=obj.app_package,
                date=today
            )
            return screen_time.duration_minutes
        except ScreenTime.DoesNotExist:
            return 0


class ScreenTimeSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    remaining_minutes = serializers.SerializerMethodField()
    is_blocked = serializers.SerializerMethodField()
    limit_exceeded = serializers.SerializerMethodField()

    class Meta:
        model = ScreenTime
        fields = [
            'id', 'child', 'child_name', 'date', 
            'app_name', 'app_package', 'duration_minutes',
            'remaining_minutes', 'is_blocked', 'limit_exceeded',
            'last_updated'
        ]
        read_only_fields = ['last_updated']

    def get_remaining_minutes(self, obj):
        return obj.get_remaining_time()

    def get_is_blocked(self, obj):
        try:
            app_limit = AppLimit.objects.get(
                child=obj.child,
                app_package=obj.app_package
            )
            return app_limit.is_blocked
        except AppLimit.DoesNotExist:
            return False

    def get_limit_exceeded(self, obj):
        return obj.is_limit_exceeded()


class ScreenTimeUpdateSerializer(serializers.Serializer):
    """Serializer for bulk screen time updates from app"""
    child_id = serializers.IntegerField()
    app_data = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

    def validate_app_data(self, value):
        """Validate app_data structure"""
        for app in value:
            if 'app_name' not in app or 'app_package' not in app or 'duration_minutes' not in app:
                raise serializers.ValidationError(
                    "Each app must have app_name, app_package, and duration_minutes"
                )
        return value


class DailyScreenTimeSummarySerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)

    class Meta:
        model = DailyScreenTimeSummary
        fields = [
            'id', 'child', 'child_name', 'date', 
            'total_minutes', 'app_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AppUsageSummarySerializer(serializers.Serializer):
    """Serializer for app-wise usage summary"""
    app_name = serializers.CharField()
    app_package = serializers.CharField()
    total_minutes = serializers.IntegerField()
    daily_limit = serializers.IntegerField()
    remaining_minutes = serializers.IntegerField()
    is_blocked = serializers.BooleanField()
    percentage_used = serializers.FloatField()



# from rest_framework import serializers
# from .models import ScreenTime
# class ScreenTimeSerializer(serializers.ModelSerializer):
#     child_name = serializers.CharField(source='child.name', read_only=True)

#     class Meta:
#         model = ScreenTime
#         fields = ['id', 'child', 'child_name', 'date', 'duration', 'app_used']