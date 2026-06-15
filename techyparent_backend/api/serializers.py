from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Parent, Child, Activity

class UserSerializer(serializers.ModelSerializer):
    """User serializer for authentication"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'

class ChildSerializer(serializers.ModelSerializer):
    """Child serializer with activities"""
    activities = ActivitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Child
        fields = ['id', 'parent', 'name', 'age', 'gender', 'date_of_birth', 
                  'avatar', 'online', 'created_at', 'activities']
        read_only_fields = ['id', 'created_at']

class ChildSimpleSerializer(serializers.ModelSerializer):
    """Simple child serializer without activities (for performance)"""
    class Meta:
        model = Child
        fields = ['id', 'name', 'age', 'gender', 'avatar', 'online']

class ParentSerializer(serializers.ModelSerializer):
    """Parent serializer with user and children"""
    user = UserSerializer(read_only=True)
    children = ChildSimpleSerializer(many=True, read_only=True)
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = ['id', 'user', 'name', 'email', 'phone', 'profile_picture', 
                  'children', 'children_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_children_count(self, obj):
        return obj.children.count()

class RegisterSerializer(serializers.ModelSerializer):
    """Registration serializer"""
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    name = serializers.CharField(max_length=100)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        name = validated_data.pop('name')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Create parent profile
        Parent.objects.create(
            user=user,
            name=name,
            email=validated_data['email']
        )
        
        return user