from rest_framework import serializers
from .models import Parent, Child, Activity

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'

class ChildSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Child
        fields = ['id', 'name', 'age', 'online', 'activities']

class ParentSerializer(serializers.ModelSerializer):
    children = ChildSerializer(many=True, read_only=True)

    class Meta:
        model = Parent
        fields = '__all__'


