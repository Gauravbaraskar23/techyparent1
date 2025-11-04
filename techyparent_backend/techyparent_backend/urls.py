
from django.contrib import admin
from django.urls import path , include
from rest_framework_simplejwt.views import TokenObtainPairView , TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/' , include('api.urls')),
    path('api/screentime/', include('screentime.urls')),
    path('api/goals/', include('goals.urls')),
    path('api/learningsuggestions/', include('learningsuggestions.urls')),
    path('api/familybonding/', include('familybonding.urls')),
    path('api/reports/', include('reports.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

