# api/urls.py
# Improved URL configuration

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # ========================================================================
    # PUBLIC ENDPOINTS
    # ========================================================================
    path('', views.api_home, name='api_home'),
    path('register/', views.register_user, name='register_user'),
    
    # ========================================================================
    # AUTHENTICATION
    # ========================================================================
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ========================================================================
    # USER & DASHBOARD
    # ========================================================================
    path('me/', views.get_current_user, name='current_user'),
    path('dashboard/', views.get_dashboard, name='dashboard'),
    
    # ========================================================================
    # CHILD MANAGEMENT
    # ========================================================================
    path('children/', views.list_children, name='list_children'),
    path('children/add/', views.add_child, name='add_child'),
    path('children/<int:child_id>/', views.child_detail, name='child_detail'),
    path('children/<int:child_id>/toggle-online/', views.toggle_child_online, name='toggle_online'),
    
    # ========================================================================
    # ACTIVITY TRACKING
    # ========================================================================
    path('children/<int:child_id>/log-activity/', views.log_activity, name='log_activity'),
]