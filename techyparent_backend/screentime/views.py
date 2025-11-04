from rest_framework import generics, views, response
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import ScreenTime
from .serializers import ScreenTimeSerializer

# ✅ List + Create ScreenTime logs
class ScreenTimeListCreateView(generics.ListCreateAPIView):
    serializer_class = ScreenTimeSerializer

    def get_queryset(self):
        queryset = ScreenTime.objects.all().order_by('-date')
        child_id = self.request.query_params.get('child_id')
        if child_id:
            queryset = queryset.filter(child_id=child_id)
        return queryset


# ✅ Weekly + Monthly summary view
class ScreenTimeSummaryView(views.APIView):
    def get(self, request):
        child_id = request.query_params.get('child_id')
        today = timezone.now().date()

        # Calculate time ranges
        week_start = today - timedelta(days=7)
        month_start = today.replace(day=1)

        # Base query
        queryset = ScreenTime.objects.all()
        if child_id:
            queryset = queryset.filter(child_id=child_id)

        # Weekly total
        weekly_total = queryset.filter(date__gte=week_start).aggregate(
            total_hours=Sum('duration')
        )['total_hours'] or 0

        # Monthly total
        monthly_total = queryset.filter(date__gte=month_start).aggregate(
            total_hours=Sum('duration')
        )['total_hours'] or 0

        # App-wise breakdown (optional but useful)
        app_usage = (
            queryset.values('app_used')
            .annotate(total_hours=Sum('duration'))
            .order_by('-total_hours')
        )

        return response.Response({
            "child_id": child_id,
            "weekly_total_hours": weekly_total,
            "monthly_total_hours": monthly_total,
            "app_usage_summary": list(app_usage),
        })
