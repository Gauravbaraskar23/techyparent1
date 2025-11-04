from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FamilyBondingCategoryViewSet, FamilyActivityViewSet

router = DefaultRouter()
router.register(r'categories', FamilyBondingCategoryViewSet, basename='familybonding-categories')
router.register(r'activities', FamilyActivityViewSet, basename='familybonding-activities')

urlpatterns = [
    path('', include(router.urls)),
]
