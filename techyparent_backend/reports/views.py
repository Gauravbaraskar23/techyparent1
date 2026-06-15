from rest_framework import generics, views, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Avg, Sum, Count, F
from datetime import timedelta, date
import calendar
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from django.conf import settings
import os

from .utils.pdf_generator import generate_pdf
from .models import DailyReport, WeeklyReport, MonthlyReport, Recommendation, ExportedReport
from .serializers import (
    DailyReportSerializer, WeeklyReportSerializer, MonthlyReportSerializer,
    RecommendationSerializer, ExportedReportSerializer, ReportSummarySerializer,
    ProgressChartDataSerializer
)
from screentime.models import ScreenTime, DailyScreenTimeSummary
from goals.models import Goal
from learningsuggestions.models import LearningSuggestion


class ReportSummaryView(views.APIView):
    """
    Main endpoint for the Reports screen
    Matches the frontend ReportsScreen.js structure
    """
    
    def get(self, request, child_id):
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=status.HTTP_404_NOT_FOUND)
        
        today = timezone.now().date()
        # thirty_days_ago = today - timedelta(days=30)
        # ===== SUMMARY CARDS =====
        
        # 1. Screen Time
        today_summary = DailyScreenTimeSummary.objects.filter(
            child=child,
            date=today
        ).first()
        
        screen_time_minutes = today_summary.total_minutes if today_summary else 0
        screen_time_hours = screen_time_minutes / 60
        screen_time_display = f"{screen_time_hours:.1f} hrs / day"
        
        # 2. Learning (Videos Watched)
        # Get videos watched in last 30 days
        thirty_days_ago = today - timedelta(days=30)
        videos_watched = LearningSuggestion.objects.filter(
            child=child,
            completed_at__gte=thirty_days_ago
        ).count()
        
        # 3. Goals Achieved
        goals_achieved = Goal.objects.filter(
            child=child,
            # is_completed=True
            status='completed'
        ).count()
        
        # ===== ACTIVITY OVERVIEW =====
        
        # Calculate activity change from yesterday
        yesterday = today - timedelta(days=1)
        yesterday_summary = DailyScreenTimeSummary.objects.filter(
            child=child,
            date=yesterday
        ).first()
        
        if yesterday_summary and yesterday_summary.total_minutes > 0:
            activity_change = ((screen_time_minutes - yesterday_summary.total_minutes) / 
                             yesterday_summary.total_minutes) * 100
        else:
            activity_change = 0.0
        
        # Get or calculate engagement level
        daily_report = DailyReport.objects.filter(
            child=child,
            date=today
        ).first()
        
        if daily_report:
            engagement_score = daily_report.engagement_score
        else:
            # Calculate basic engagement score
            engagement_score = min(100, (videos_watched * 10) + (goals_achieved * 20))
        
        # Determine engagement category
        if videos_watched >= 5:
            engagement_category = "Creative Learning"
        elif goals_achieved >= 3:
            engagement_category = "Goal Achievement"
        else:
            engagement_category = "General Activity"
        
        engagement_level = "High" if engagement_score >= 70 else "Medium" if engagement_score >= 40 else "Low"
        
        # ===== WEEKLY CHART DATA =====
        
        weekly_data = []
        for i in range(7):
            day = today - timedelta(days=6-i)
            day_summary = DailyScreenTimeSummary.objects.filter(
                child=child,
                date=day
            ).first()
            
            day_videos = LearningSuggestion.objects.filter(
                child=child,
                completed_at__date=day,
                status='completed'
            ).count()
            
            day_report = DailyReport.objects.filter(
                child=child,
                date=day
            ).first()
            
            weekly_data.append({
                'date': day,
                'label': day.strftime('%a'),  # Mon, Tue, etc.
                'screen_time_minutes': day_summary.total_minutes if day_summary else 0,
                'videos_watched': day_videos,
                'engagement_score': day_report.engagement_score if day_report else 0
            })
        
        # ===== RECOMMENDATIONS =====
        
        recommendations = Recommendation.objects.filter(
            child=child,
            is_active=True,
            is_completed=False
        )[:5]  # Top 5 recommendations
        
        # If no recommendations exist, create default ones
        if not recommendations.exists():
            self._create_default_recommendations(child, screen_time_minutes, videos_watched)
            recommendations = Recommendation.objects.filter(
                child=child,
                is_active=True,
                is_completed=False
            )[:5]
        
        # Serialize data
        serializer = ReportSummarySerializer({
            'screen_time_today': screen_time_display,
            'videos_watched_total': videos_watched,
            'goals_achieved_total': goals_achieved,
            'daily_activity_change': round(activity_change, 1),
            'engagement_level': engagement_level,
            'engagement_category': engagement_category,
            'weekly_data': weekly_data,
            'recommendations': recommendations
        })
        
        return Response(serializer.data)
    
    def _create_default_recommendations(self, child, screen_time_minutes, videos_watched):
        """Create default recommendations based on current activity"""
        
        # Recommendation 1: Creativity
        Recommendation.objects.create(
            child=child,
            title="Encourage Creativity",
            description="Try adding drawing and storytelling activities to boost imagination.",
            category="creativity",
            priority="medium",
            icon_name="bulb-outline",
            based_on_data={'screen_time': screen_time_minutes}
        )
        
        # Recommendation 2: Screen Time Balance
        if screen_time_minutes > 180:  # More than 3 hours
            Recommendation.objects.create(
                child=child,
                title="Balanced Screen Time",
                description="Maintain healthy limits and take short breaks after learning sessions.",
                category="screen_time",
                priority="high",
                icon_name="fitness-outline",
                based_on_data={'screen_time': screen_time_minutes}
            )
        else:
            Recommendation.objects.create(
                child=child,
                title="Great Screen Time Balance!",
                description="Keep up the good work with balanced screen time usage.",
                category="screen_time",
                priority="low",
                icon_name="checkmark-circle-outline",
                based_on_data={'screen_time': screen_time_minutes}
            )
        
        # Recommendation 3: Learning
        if videos_watched < 5:
            Recommendation.objects.create(
                child=child,
                title="Explore More Learning Content",
                description="Discover new educational videos in math, science, and arts.",
                category="learning",
                priority="medium",
                icon_name="school-outline",
                based_on_data={'videos_watched': videos_watched}
            )
        
        # Recommendation 4: Physical Activity
        Recommendation.objects.create(
            child=child,
            title="Physical Activity Break",
            description="Take a 15-minute outdoor break every 2 hours for healthy development.",
            category="physical",
            priority="medium",
            icon_name="walk-outline",
            based_on_data={}
        )


class DailyReportView(generics.ListAPIView):
    """Get daily reports for a child"""
    serializer_class = DailyReportSerializer
    
    def get_queryset(self):
        child_id = self.kwargs['child_id']
        days = int(self.request.query_params.get('days', 30))
        
        start_date = timezone.now().date() - timedelta(days=days)
        
        return DailyReport.objects.filter(
            child_id=child_id,
            date__gte=start_date
        )


class WeeklyReportView(generics.ListAPIView):
    """Get weekly reports for a child"""
    serializer_class = WeeklyReportSerializer
    
    def get_queryset(self):
        child_id = self.kwargs['child_id']
        weeks = int(self.request.query_params.get('weeks', 8))
        
        start_date = timezone.now().date() - timedelta(weeks=weeks)
        
        return WeeklyReport.objects.filter(
            child_id=child_id,
            week_start_date__gte=start_date
        )


class MonthlyReportView(generics.ListAPIView):
    """Get monthly reports for a child"""
    serializer_class = MonthlyReportSerializer
    
    def get_queryset(self):
        child_id = self.kwargs['child_id']
        months = int(self.request.query_params.get('months', 6))
        
        today = timezone.now().date()
        start_month = today.month - months
        start_year = today.year
        
        # Adjust year if months go back to previous year
        while start_month <= 0:
            start_month += 12
            start_year -= 1
        
        return MonthlyReport.objects.filter(
            child_id=child_id
        ).filter(
            year__gte=start_year
        )


class RecommendationsView(generics.ListAPIView):
    """Get active recommendations for a child"""
    serializer_class = RecommendationSerializer
    
    def get_queryset(self):
        child_id = self.kwargs['child_id']
        
        return Recommendation.objects.filter(
            child_id=child_id,
            is_active=True,
            is_completed=False
        )


class CompleteRecommendationView(views.APIView):
    """Mark a recommendation as completed"""
    
    def post(self, request, pk):
        try:
            recommendation = Recommendation.objects.get(pk=pk)
            recommendation.is_completed = True
            recommendation.completed_at = timezone.now()
            recommendation.save()
            
            serializer = RecommendationSerializer(recommendation)
            return Response(serializer.data)
        except Recommendation.DoesNotExist:
            return Response(
                {'error': 'Recommendation not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ExportReportView(views.APIView):
    """Export report as PDF"""
    
    def post(self, request, child_id):
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=status.HTTP_404_NOT_FOUND)
        
        report_type = request.data.get('report_type', 'weekly')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        # Set default dates if not provided
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=7)
        if not end_date:
            end_date = timezone.now().date()
        
        summary_data = ReportSummaryView().get(request, child_id).data

        weekly_data = summary_data.get("weekly_data", [])
        recommendations = Recommendation.objects.filter(
            child=child,
            is_active=True,
            is_completed=False
        )

        

        # Generate PDF (you'll implement this)
        file_name = f"{child.name}_{report_type}_report_{start_date}_{end_date}.pdf"
        
        # 📁 FILE PATH (IMPORTANT FIX)
        reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        # file_path = f"reports/{file_name}"
        file_path = os.path.join(reports_dir, file_name)
        # relative_path = f"reports/{file_name}"
        # file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        # 🔥 GENERATE PDF
        generate_pdf(file_path, child, summary_data, weekly_data, recommendations)

        file_url = request.build_absolute_uri(
    settings.MEDIA_URL + f"reports/{file_name}"
        )
        # TODO: Implement actual PDF generation
        # For now, just create the record
        exported_report = ExportedReport.objects.create(
            child=child,
            report_type=report_type,
            start_date=start_date,
            end_date=end_date,
            file_name=file_name,
            file_path=file_path
            # file_path=relative_path
        )
        
        serializer = ExportedReportSerializer(exported_report)
        # download_url = request.build_absolute_uri(settings.MEDIA_URL + relative_path)
        return Response({
            'success': True,
            'message': 'Report exported successfully',
            'report': serializer.data,
            # 'download_url': f'/media/{file_path}'  # Adjust based on your media setup
            'download_url': file_url
        })


class ChartDataView(views.APIView):
    """Get chart data for visualizations"""
    
    def get(self, request, child_id):
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=status.HTTP_404_NOT_FOUND)
        
        period = request.query_params.get('period', 'week')  # week, month, year
        
        if period == 'week':
            days = 7
        elif period == 'month':
            days = 30
        else:
            days = 365
        
        chart_data = []
        today = timezone.now().date()
        
        for i in range(days):
            day = today - timedelta(days=days-1-i)
            
            # Get screen time
            day_summary = DailyScreenTimeSummary.objects.filter(
                child=child,
                date=day
            ).first()
            
            # Get videos watched
            videos = LearningSuggestion.objects.filter(
                child=child,
                completed_at__date=day,
                status='completed'
            ).count()
            
            # Get daily report for engagement
            day_report = DailyReport.objects.filter(
                child=child,
                date=day
            ).first()
            
            chart_data.append({
                'date': day,
                'label': day.strftime('%b %d') if period != 'week' else day.strftime('%a'),
                'screen_time_minutes': day_summary.total_minutes if day_summary else 0,
                'videos_watched': videos,
                'engagement_score': day_report.engagement_score if day_report else 0
            })
        
        serializer = ProgressChartDataSerializer(chart_data, many=True)
        
        return Response({
            'period': period,
            'data': serializer.data
        })


class GenerateReportsView(views.APIView):
    """
    Background job to generate daily/weekly/monthly reports
    Call this from a cron job or celery task
    """
    
    def post(self, request):
        from api.models import Child
        
        today = timezone.now().date()
        
        # Generate daily reports for all children
        for child in Child.objects.all():
            # Get today's data
            today_summary = DailyScreenTimeSummary.objects.filter(
                child=child,
                date=today
            ).first()
            
            videos_today = LearningSuggestion.objects.filter(
                child=child,
                watched_at__date=today
            ).count()
            
            goals_achieved_today = Goal.objects.filter(
                child=child,
                # is_completed=True,
                status='completed',
                completed_at__date=today
            ).count()
            
            goals_in_progress = Goal.objects.filter(
                child=child,
                is_completed=False
            ).count()
            
            # Calculate engagement score
            screen_time = today_summary.total_minutes if today_summary else 0
            engagement_score = min(100, (videos_today * 15) + (goals_achieved_today * 25))
            
            # Get most used app
            most_used = ScreenTime.objects.filter(
                child=child,
                date=today
            ).order_by('-duration_minutes').first()
            
            # Create or update daily report
            DailyReport.objects.update_or_create(
                child=child,
                date=today,
                defaults={
                    'total_screen_time_minutes': screen_time,
                    'apps_used_count': today_summary.app_count if today_summary else 0,
                    'most_used_app': most_used.app_name if most_used else '',
                    'videos_watched': videos_today,
                    'goals_achieved': goals_achieved_today,
                    'goals_in_progress': goals_in_progress,
                    'engagement_score': engagement_score
                }
            )
        
        return Response({
            'success': True,
            'message': f'Generated reports for {Child.objects.count()} children'
        })