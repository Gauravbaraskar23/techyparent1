from rest_framework import serializers
from .models import ScreenTime
class ScreenTimeSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)

    class Meta:
        model = ScreenTime
        fields = ['id', 'child', 'child_name', 'date', 'duration', 'app_used']