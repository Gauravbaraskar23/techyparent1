from django.urls import path
from .views import (
    AppLimitListCreateView,
    AppLimitDetailView,
    ScreenTimeUpdateView,
    ScreenTimeListView,
    TodayScreenTimeView,
    WeeklyMonthlyScreenTimeView,
    CheckAppAccessView
)

urlpatterns = [
    # App Limits Management
    path('app-limits/', AppLimitListCreateView.as_view(), name='app-limits-list-create'),
    path('app-limits/<int:pk>/', AppLimitDetailView.as_view(), name='app-limit-detail'),
    
    # Screen Time Tracking
    path('update/', ScreenTimeUpdateView.as_view(), name='screentime-update'),
    path('list/', ScreenTimeListView.as_view(), name='screentime-list'),
    path('today/', TodayScreenTimeView.as_view(), name='screentime-today'),
    path('summary/', WeeklyMonthlyScreenTimeView.as_view(), name='screentime-summary'),
    
    # App Access Control
    path('check-access/', CheckAppAccessView.as_view(), name='check-app-access'),
]



# from django.urls import path
# from .views import ScreenTimeListCreateView, ScreenTimeSummaryView

# urlpatterns = [
#     path('', ScreenTimeListCreateView.as_view(), name='screentime-list-create'),
#     path('summary/', ScreenTimeSummaryView.as_view(), name='screentime-summary'),
# ]
