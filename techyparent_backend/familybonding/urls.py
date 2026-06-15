# familybonding/urls.py

from django.urls import path
from .views import *

urlpatterns = [
    # Categories
    path('categories/', ActivityCategoryListView.as_view()),
    
    # Activities
    path('activities/<int:parent_id>/', FamilyActivityListCreateView.as_view()),
    path('activities/detail/<int:activity_id>/', FamilyActivityDetailView.as_view()),
    path('activities/complete/<int:activity_id>/', CompleteActivityView.as_view()),
    
    # Ratings
    path('ratings/<int:activity_id>/', ActivityRatingView.as_view()),
    
    # Memories
    path('memories/<int:parent_id>/', FamilyMemoryListCreateView.as_view()),
    path('memories/comment/<int:memory_id>/', MemoryCommentView.as_view()),
    
    # Templates
    path('templates/', ActivityTemplateListView.as_view()),
    path('templates/create-from/', CreateFromTemplateView.as_view()),
    
    # Dashboard & Stats
    path('dashboard/<int:parent_id>/', FamilyBondingDashboardView.as_view()),
    path('stats/<int:parent_id>/', QualityTimeStatsView.as_view()),
    
    # Challenges
    path('challenges/<int:parent_id>/', FamilyChallengeView.as_view()),
    path('challenges/progress/<int:challenge_id>/', UpdateChallengeProgressView.as_view()),
    
    # Milestones
    path('milestones/<int:parent_id>/', FamilyMilestonesView.as_view()),
]