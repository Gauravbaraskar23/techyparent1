from rest_framework import serializers
from .models import LearningVideo, ChildLearningProgress

class LearningVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningVideo
        fields = "__all__"

class ChildLearningProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildLearningProgress
        fields = "__all__"
