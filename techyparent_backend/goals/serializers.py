
from rest_framework import serializers
from .models import *

class GoalCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalCategory
        fields = '__all__'

class GoalSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Goal
        fields = '__all__'
    
    def get_progress_percentage(self, obj):
        return obj.get_progress_percentage()
    
    def get_is_overdue(self, obj):
        return obj.is_overdue()

class GoalDetailSerializer(serializers.ModelSerializer):
    category = GoalCategorySerializer(read_only=True)
    milestones = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Goal
        fields = '__all__'
    
    def get_milestones(self, obj):
        return GoalMilestoneSerializer(obj.milestones.all(), many=True).data
    
    def get_comments(self, obj):
        return GoalCommentSerializer(obj.comments.all()[:5], many=True).data
    
    def get_progress_percentage(self, obj):
        return obj.get_progress_percentage()

class GoalMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalMilestone
        fields = '__all__'

class GoalCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalComment
        fields = '__all__'

class GoalTemplateSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    
    class Meta:
        model = GoalTemplate
        fields = '__all__'

class ChildPointsSerializer(serializers.ModelSerializer):
    progress_to_next_level = serializers.SerializerMethodField()
    
    class Meta:
        model = ChildPoints
        fields = '__all__'
    
    def get_progress_to_next_level(self, obj):
        if obj.points_to_next_level == 0:
            return 0
        return int((obj.total_points / obj.points_to_next_level) * 100)

class GoalBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalBadge
        fields = '__all__'

class ChildGoalBadgeSerializer(serializers.ModelSerializer):
    badge = GoalBadgeSerializer(read_only=True)
    
    class Meta:
        model = ChildGoalBadge
        fields = '__all__'