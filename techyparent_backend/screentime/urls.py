from django.urls import path
from .views import ScreenTimeListCreateView, ScreenTimeSummaryView

urlpatterns = [
    path('', ScreenTimeListCreateView.as_view(), name='screentime-list-create'),
    path('summary/', ScreenTimeSummaryView.as_view(), name='screentime-summary'),
]
