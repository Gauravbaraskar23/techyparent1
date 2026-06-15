from django.urls import path
from .views import (
    NotificationListView,
    NotificationCreateView,
    MarkAsReadView,
    MarkAllAsReadView,
    DeleteNotificationView,
    ClearAllNotificationsView,
    NotificationSummaryView,
    RecentNotificationsView,
)

urlpatterns = [
    # List and filter notifications
    path('<int:child_id>/', NotificationListView.as_view(), name='child-notifications'),
    
    # Create notification
    path('create/', NotificationCreateView.as_view(), name='create-notification'),
    
    # Mark as read
    path('read/<int:pk>/', MarkAsReadView.as_view(), name='mark-read'),
    path('read-all/<int:child_id>/', MarkAllAsReadView.as_view(), name='mark-all-read'),
    
    # Delete notifications
    path('delete/<int:pk>/', DeleteNotificationView.as_view(), name='delete-notification'),
    path('clear/<int:child_id>/', ClearAllNotificationsView.as_view(), name='clear-notifications'),
    
    # Summary and stats
    path('summary/<int:child_id>/', NotificationSummaryView.as_view(), name='notification-summary'),
    path('recent/<int:child_id>/', RecentNotificationsView.as_view(), name='recent-notifications'),
]



# from django.urls import path
# from .views import NotificationListView, MarkAsReadView

# urlpatterns = [
#     path("<int:child_id>/", NotificationListView.as_view(), name="child-notifications"),
#     path("read/<int:pk>/", MarkAsReadView.as_view(), name="mark-read"),
# ]
