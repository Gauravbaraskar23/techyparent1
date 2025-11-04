from django.shortcuts import render
from rest_framework import viewsets, filters
from .models import FamilyBondingCategory, FamilyActivity
from .serializers import FamilyBondingCategorySerializer, FamilyActivitySerializer

class FamilyBondingCategoryViewSet(viewsets.ModelViewSet):
    queryset = FamilyBondingCategory.objects.all()
    serializer_class = FamilyBondingCategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class FamilyActivityViewSet(viewsets.ModelViewSet):
    queryset = FamilyActivity.objects.all()
    serializer_class = FamilyActivitySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        age_group = self.request.query_params.get('age_group')
        category_id = self.request.query_params.get('category_id')
        if age_group:
            queryset = queryset.filter(age_group=age_group)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset
