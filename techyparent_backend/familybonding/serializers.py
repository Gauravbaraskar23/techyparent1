# familybonding/serializers.py

from rest_framework import serializers
from .models import *

class ActivityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityCategory
        fields = '__all__'

class FamilyActivitySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    children_names = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyActivity
        fields = '__all__'
    
    def get_children_names(self, obj):
        return [child.name for child in obj.children.all()]

class FamilyActivityDetailSerializer(serializers.ModelSerializer):
    category = ActivityCategorySerializer(read_only=True)
    ratings = serializers.SerializerMethodField()
    memories = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyActivity
        fields = '__all__'
    
    def get_ratings(self, obj):
        return ActivityRatingSerializer(obj.ratings.all(), many=True).data
    
    def get_memories(self, obj):
        return FamilyMemorySerializer(obj.memories.all(), many=True).data

class ActivityRatingSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    
    class Meta:
        model = ActivityRating
        fields = '__all__'

class FamilyMemorySerializer(serializers.ModelSerializer):
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    comments = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyMemory
        fields = '__all__'
    
    def get_comments(self, obj):
        return MemoryCommentSerializer(obj.comments.all(), many=True).data

class MemoryCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemoryComment
        fields = '__all__'

class ActivityTemplateSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    
    class Meta:
        model = ActivityTemplate
        fields = '__all__'

class BondingStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = BondingStreak
        fields = '__all__'

class FamilyChallengeSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyChallenge
        fields = '__all__'
    
    def get_progress_percentage(self, obj):
        if obj.target_activities == 0:
            return 0
        return min(100, int((obj.activities_completed / obj.target_activities) * 100))

class QualityTimeStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityTimeStats
        fields = '__all__'

class FamilyMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMilestone
        fields = '__all__'