from django.urls import path
from .views import (
    RoutineCategoryListView,
    DailyRoutineListCreateView,
    DailyRoutineDetailView,
    DailyRoutineSummaryView,
    TodayActivitiesView,
    RoutineActivityCreateView,
    RoutineActivityUpdateView,
    ToggleActivityCompletionView,
    BulkUpdateCompletionsView,
    RoutineStatsView,
    RoutineTemplateListView,
    CreateRoutineFromTemplateView,
    ReorderActivitiesView,
    ProcessVoiceCommandView,
    GetActivityReminderView,
    GetActivityStartNotificationView,
    VoiceSettingsView
)

urlpatterns = [
    # Categories
    path('categories/', RoutineCategoryListView.as_view(), name='routine-categories'),
    
    # Routines
    path('routines/', DailyRoutineListCreateView.as_view(), name='routines-list-create'),
    path('routines/<int:pk>/', DailyRoutineDetailView.as_view(), name='routine-detail'),
    path('routines/<int:routine_id>/reorder/', ReorderActivitiesView.as_view(), name='reorder-activities'),
    
    # Dashboard Summary
    path('summary/<int:child_id>/', DailyRoutineSummaryView.as_view(), name='routine-summary'),
    path('today/<int:child_id>/', TodayActivitiesView.as_view(), name='today-activities'),
    
    # Activities
    path('activities/create/', RoutineActivityCreateView.as_view(), name='activity-create'),
    path('activities/<int:pk>/', RoutineActivityUpdateView.as_view(), name='activity-update'),
    path('activities/<int:activity_id>/toggle/', ToggleActivityCompletionView.as_view(), name='toggle-completion'),
    path('activities/bulk-update/', BulkUpdateCompletionsView.as_view(), name='bulk-update'),
    
    # Statistics
    path('stats/<int:child_id>/', RoutineStatsView.as_view(), name='routine-stats'),
    
    # # Templates
    path('templates/', RoutineTemplateListView.as_view(), name='routine-templates'),
    path('templates/create-from/', CreateRoutineFromTemplateView.as_view(), name='create-from-template'),
    
    # Voice integration
    path('voice/command/', ProcessVoiceCommandView.as_view(), name='process-voice-command'),
    path('voice/reminders/<int:child_id>/', GetActivityReminderView.as_view(), name='activity-reminders'),
    path('voice/start-notifications/<int:child_id>/', GetActivityStartNotificationView.as_view(), name='start-notifications'),
    path('voice/settings/<int:child_id>/', VoiceSettingsView.as_view(), name='voice-settings'),
    
]