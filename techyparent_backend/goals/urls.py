
from django.urls import path
from .views import *

urlpatterns = [
    # Categories & Templates
    path('categories/', GoalCategoryListView.as_view()),
    path('templates/', GoalTemplateListView.as_view()),
    path('templates/create-from/', CreateGoalFromTemplateView.as_view()),
    
    # Goals CRUD
    path('list/<int:child_id>/', GoalListCreateView.as_view()),
    path('detail/<int:goal_id>/', GoalDetailView.as_view()),
    
    # Goal Actions
    path('progress/<int:goal_id>/', UpdateGoalProgressView.as_view()),
    path('complete/<int:goal_id>/', CompleteGoalView.as_view()),
    path('toggle-pause/<int:goal_id>/', ToggleGoalPauseView.as_view()),
    
    # Comments
    path('comments/<int:goal_id>/', GoalCommentView.as_view()),
    
    # Dashboard & Analytics
    path('dashboard/<int:child_id>/', GoalDashboardView.as_view()),
    path('analytics/<int:child_id>/', GoalAnalyticsView.as_view()),
    
    # Badges
    path('badges/<int:child_id>/', GoalBadgesView.as_view()),
    
    # Collaborative
    path('collaborative/', CollaborativeGoalView.as_view()),
]
