from django.urls import path
from .views import (
    ReportSummaryView,
    DailyReportView,
    WeeklyReportView,
    MonthlyReportView,
    RecommendationsView,
    CompleteRecommendationView,
    ExportReportView,
    ChartDataView,
    GenerateReportsView,
)

urlpatterns = [
    # Main report summary (matches frontend)
    path('summary/<int:child_id>/', ReportSummaryView.as_view(), name='report-summary'),
    
    # Historical reports
    path('daily/<int:child_id>/', DailyReportView.as_view(), name='daily-reports'),
    path('weekly/<int:child_id>/', WeeklyReportView.as_view(), name='weekly-reports'),
    path('monthly/<int:child_id>/', MonthlyReportView.as_view(), name='monthly-reports'),
    
    # Recommendations
    path('recommendations/<int:child_id>/', RecommendationsView.as_view(), name='recommendations'),
    path('recommendations/<int:pk>/complete/', CompleteRecommendationView.as_view(), name='complete-recommendation'),
    
    # Export
    path('export/<int:child_id>/', ExportReportView.as_view(), name='export-report'),
    
    # Chart data
    path('chart-data/<int:child_id>/', ChartDataView.as_view(), name='chart-data'),
    
    # Generate reports (for cron/background jobs)
    path('generate/', GenerateReportsView.as_view(), name='generate-reports'),
]