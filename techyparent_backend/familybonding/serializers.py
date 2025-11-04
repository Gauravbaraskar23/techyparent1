from rest_framework import serializers
from .models import FamilyBondingCategory, FamilyActivity

class FamilyActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyActivity
        fields = '__all__'


class FamilyBondingCategorySerializer(serializers.ModelSerializer):
    activities = FamilyActivitySerializer(many=True, read_only=True)

    class Meta:
        model = FamilyBondingCategory
        fields = '__all__'
