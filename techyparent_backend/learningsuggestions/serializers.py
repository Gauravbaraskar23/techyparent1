# learningsuggestions/serializers.py

from rest_framework import serializers
from .models import (
    LearningCategory, ChildInterest, LearningResource,
    LearningSuggestion, LearningProgress, DailyLearningGoal,
    ChatSession, ChatMessage, ChatbotPersonality,
    ProblemReport, QuizQuestion, ChildQuizAttempt,
    Achievement, ChildAchievement,
)


class LearningCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningCategory
        fields = ['id', 'name', 'display_name', 'description', 'icon_name', 'color', 'order']


class ChildInterestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_icon = serializers.CharField(source='category.icon_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)

    class Meta:
        model = ChildInterest
        fields = ['id', 'category', 'category_name', 'category_icon', 'category_color',
                  'interest_level', 'notes', 'created_at']


class LearningResourceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)

    class Meta:
        model = LearningResource
        fields = ['id', 'title', 'description', 'category', 'category_name', 'category_color',
                  'resource_type', 'difficulty', 'age_group', 'url', 'thumbnail_url',
                  'duration_minutes', 'tags', 'is_free']


class LearningSuggestionSerializer(serializers.ModelSerializer):
    resource = LearningResourceSerializer(read_only=True)
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon_name', read_only=True)

    class Meta:
        model = LearningSuggestion
        fields = ['id', 'resource', 'category', 'category_name', 'category_color',
                  'category_icon', 'reason', 'relevance_score', 'status',
                  'suggested_at', 'accepted_at', 'completed_at', 'rating', 'feedback_text']


class LearningProgressSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon_name', read_only=True)

    class Meta:
        model = LearningProgress
        fields = ['id', 'category', 'category_name', 'category_color', 'category_icon',
                  'resources_completed', 'total_time_minutes', 'avg_rating',
                  'streak_days', 'last_activity_date']


class DailyLearningGoalSerializer(serializers.ModelSerializer):
    completion_percentage = serializers.SerializerMethodField()
    time_percentage = serializers.SerializerMethodField()

    class Meta:
        model = DailyLearningGoal
        fields = ['id', 'date', 'target_minutes', 'actual_minutes',
                  'resources_target', 'resources_completed', 'is_achieved',
                  'completion_percentage', 'time_percentage']

    def get_completion_percentage(self, obj):
        if obj.resources_target == 0:
            return 0
        return min(100, int((obj.resources_completed / obj.resources_target) * 100))

    def get_time_percentage(self, obj):
        if obj.target_minutes == 0:
            return 0
        return min(100, int((obj.actual_minutes / obj.target_minutes) * 100))


class ChatMessageSerializer(serializers.ModelSerializer):
    time_display = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'message_type', 'content', 'metadata',
                  'is_read', 'created_at', 'time_display']

    def get_time_display(self, obj):
        return obj.created_at.strftime('%I:%M %p')


class ChatSessionSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'child', 'child_name', 'title', 'started_at', 'ended_at',
                  'mood_start', 'mood_end', 'topic_category', 'is_active',
                  'message_count', 'last_message']

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return {'content': last.content[:100], 'sender': last.sender}
        return None


class ChatbotPersonalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotPersonality
        fields = ['id', 'bot_name', 'personality_type', 'use_emojis',
                  'language', 'difficulty_level']


class ProblemReportSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = ProblemReport
        fields = ['id', 'child_name', 'category', 'severity', 'description',
                  'ai_response', 'parent_notified', 'is_resolved', 'resolved_at',
                  'created_at', 'time_ago']

    def get_time_ago(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        hours = diff.seconds // 3600
        if hours > 0:
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"


class QuizQuestionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ['id', 'category', 'category_name', 'question',
                  'option_a', 'option_b', 'option_c', 'option_d',
                  'difficulty', 'age_group']
        # NOTE: correct_answer is NOT included - never send to frontend!


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'achievement_type',
                  'icon_name', 'color', 'points', 'requirement_value']


class ChildAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    earned_date = serializers.DateField(source='earned_at', read_only=True)

    class Meta:
        model = ChildAchievement
        fields = ['id', 'achievement', 'earned_at', 'earned_date', 'points_earned']