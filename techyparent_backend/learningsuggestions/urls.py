from django.urls import path
from .views import (
    learning_suggestions_for_child,
    LearningVideoListCreateView,
    ChildLearningProgressView,
)

urlpatterns = [
    path('videos/', LearningVideoListCreateView.as_view(), name='video-list'),
    path('suggestions/<int:child_id>/', learning_suggestions_for_child, name='child-learning-suggestions'),
    path('progress/', ChildLearningProgressView.as_view(), name='child-learning-progress'),
]
