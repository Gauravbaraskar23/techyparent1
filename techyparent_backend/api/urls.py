from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('', views.api_home, name='api_home'),
    path('register/', views.register_user, name='register_user'),
    path('add-child/', views.add_child , name = 'add-child'),
    path('dashboard/', views.get_dashboard, name='dashboard'),
    # path('dashboard/', views.dashboard_view, name='dashboard'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
