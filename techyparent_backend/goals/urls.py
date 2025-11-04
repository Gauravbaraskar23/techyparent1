from django.urls import path
from .views import GoalListCreateView

urlpatterns = [
    path('', GoalListCreateView.as_view(), name='goal-list'),
]
