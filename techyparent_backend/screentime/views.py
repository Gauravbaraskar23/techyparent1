from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import generics, views, status
from rest_framework.response import Response
from datetime import timedelta, datetime
from .models import ScreenTime, AppLimit, DailyScreenTimeSummary
from .serializers import (
    ScreenTimeSerializer, AppLimitSerializer, 
    ScreenTimeUpdateSerializer, DailyScreenTimeSummarySerializer,
    AppUsageSummarySerializer
)
from notifications.models import Notification
from notifications.utils import (
    create_screen_time_limit_notification,
    create_screen_time_warning_notification,
    create_app_blocked_notification
)
import sys
sys.path.append('..')   # Add parent directory to path for imports

class AppLimitListCreateView(generics.ListCreateAPIView):
    """List all app limits or create new ones"""
    serializer_class = AppLimitSerializer

    def get_queryset(self):
        queryset = AppLimit.objects.all()
        child_id = self.request.query_params.get('child_id')
        if child_id:
            queryset = queryset.filter(child_id=child_id)
        return queryset


class AppLimitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a specific app limit"""
    queryset = AppLimit.objects.all()
    serializer_class = AppLimitSerializer


class ScreenTimeUpdateView(views.APIView):
    """Bulk update screen time from mobile app background service"""
    
    def post(self, request):
        serializer = ScreenTimeUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        child_id = serializer.validated_data['child_id']
        app_data = serializer.validated_data['app_data']
        today = timezone.now().date()
        
        try:
            from api.models import Child
            child = Child.objects.get(id=child_id)
        except Child.DoesNotExist:
            return Response(
                {"error": "Child not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        updated_apps = []
        blocked_apps = []
        exceeded_apps = []
        
        app_limits = AppLimit.objects.filter(child=child)
        app_limits_dict = {limit.app_package: limit for limit in app_limits}
        
        # Update screen time for each app
        for app in app_data:
            screen_time, created = ScreenTime.objects.update_or_create(
                child=child,
                date=today,
                app_package=app['app_package'],
                defaults={
                    'app_name': app['app_name'],
                    'duration_minutes': app['duration_minutes']
                }
            )
            
            if not created:
                # Always update to the latest duration (in case of multiple updates in a day)
                if app['duration_minutes'] > screen_time.duration_minutes:
                    screen_time.duration_minutes = app['duration_minutes']
                    screen_time.save()
            # Upadated some  70- 192 lines of code
            try:
                # app_limit = AppLimit.objects.get(
                #     child=child,
                #     app_package=app['app_package']
                # )
                app_limit = app_limits_dict.get(app['app_package'])
                if not app_limit:
                    continue
                
                # Check if notification already exists for today
                existing_notification = Notification.objects.filter(
                    child=child,
                    related_app_package=app['app_package'],
                    created_at__date=today,
                    notification_type__in=['limit_reached', 'limit_warning']
                ).exists()
                duration = int(app['duration_minutes'])
                percentage_used = (duration / app_limit.daily_limit_minutes * 100) if app_limit.daily_limit_minutes > 0 else 0
                
                # Create notifications based on usage
                if duration >= app_limit.daily_limit_minutes:
                    exceeded_apps.append({
                        'app_name': app['app_name'],
                        'app_package': app['app_package']
                    })
                    
                    if app_limit.is_blocked:
                        blocked_apps.append({
                            'app_name': app['app_name'],
                            'app_package': app['app_package']
                        })
                    if not existing_notification:
                            create_screen_time_limit_notification(
                                child,
                                app['app_name'],
                                app['duration_minutes'],
                                app_limit.daily_limit_minutes
                            )
                    elif percentage_used >= 80 and not existing_notification:
                        remaining_minutes = app_limit.daily_limit_minutes - duration

                        create_screen_time_warning_notification(
                            child,
                            app['app_name'],
                            app['duration_minutes'],
                            app_limit.daily_limit_minutes,
                            remaining_minutes
                        )              
                    # Create limit reached notification (only once per day)
                    # if not existing_notification:
                        # Notification.objects.create(
                        #     child=child,
                        #     title="⏰ Screen Time Limit Reached",
                        #     message=f"{app['app_name']} has reached its daily limit of {app_limit.daily_limit_minutes} minutes!",
                        #     notification_type="limit_reached",
                        #     priority="high",
                        #     action_required=True,
                        #     related_app_package=app['app_package'],
                        #     related_data={
                        #         'app_name': app['app_name'],
                        #         'used_minutes': app['duration_minutes'],
                        #         'limit_minutes': app_limit.daily_limit_minutes,
                        #         'exceeded_by': app['duration_minutes'] - app_limit.daily_limit_minutes
                        #     }
                        # )
                
                # # Warning at 80% (only once per day)
                # elif percentage_used >= 80 and not existing_notification:
                #     remaining_minutes = app_limit.daily_limit_minutes - app['duration_minutes']
                #     Notification.objects.create(
                #         child=child,
                #         title="⚠️ Screen Time Warning",
                #         message=f"{app['app_name']} is approaching its limit. Only {remaining_minutes} minutes remaining!",
                #         notification_type="limit_warning",
                #         priority="medium",
                #         action_required=False,
                #         related_app_package=app['app_package'],
                #         related_data= {
                #             'app_name': app['app_name'],
                #             'used_minutes': app['duration_minutes'],
                #             'limit_minutes': app_limit.daily_limit_minutes,
                #             'remaining_minutes': remaining_minutes,
                #             'percentage_used': percentage_used
                #         }
                #     )
                
                # App blocked notification
                if app_limit.is_blocked:
                    # blocked_notification_exists = Notification.objects.filter(
                    #     child=child,
                    #     related_app_package=app['app_package'],
                    #     created_at__date=today,
                    #     notification_type='app_blocked'
                    # ).exists()
                    create_app_blocked_notification(child, app['app_name'])
                    
                    # if not blocked_notification_exists:
                    #     Notification.objects.create(
                    #         child=child,
                    #         title="🚫 App Blocked",
                    #         message=f"{app['app_name']} has been blocked and cannot be accessed.",
                    #         notification_type="app_blocked",
                    #         priority="critical",
                    #         action_required=True,
                    #         related_app_package=app['app_package'],
                    #         related_data={
                    #             'app_name': app['app_name'],
                    #             'blocked_at': timezone.now().isoformat()
                    #         }
                    #     )
                        
            except AppLimit.DoesNotExist:
                pass
            
            updated_apps.append(screen_time.app_name)
        
        # Update daily summary
        total_minutes = ScreenTime.objects.filter(
            child=child,
            date=today
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        app_count = ScreenTime.objects.filter(
            child=child,
            date=today
        ).count()
        
        DailyScreenTimeSummary.objects.update_or_create(
            child=child,
            date=today,
            defaults={
                'total_minutes': total_minutes,
                'app_count': app_count
            }
        )
        
        return Response({
            "success": True,
            "updated_apps": updated_apps,
            "blocked_apps": blocked_apps,
            "exceeded_apps": exceeded_apps,
            "total_screen_time_today": total_minutes,
            "notifications_created": len(exceeded_apps)  # Number of new notifications
        })
            
        #     # Check if limit exceeded
        #     if screen_time.is_limit_exceeded():
        #         exceeded_apps.append({
        #             'app_name': app['app_name'],
        #             'app_package': app['app_package']
        #         })
                
        #         # Create notification
        #         try:
        #             app_limit = AppLimit.objects.get(
        #                 child=child,
        #                 app_package=app['app_package']
        #             )
                    
        #             if app_limit.is_blocked:
        #                 blocked_apps.append(app['app_name'])
                    
        #             # Create notification only once per day
        #             notification_exists = Notification.objects.filter(
        #                 child=child,
        #                 created_at__date=today,
        #                 message__contains=app['app_name']
        #             ).exists()
                    
        #             if not notification_exists:
        #                 Notification.objects.create(
        #                     child=child,
        #                     title="Screen Time Limit Reached",
        #                     message=f"{app['app_name']} has reached its daily limit of {app_limit.daily_limit_minutes} minutes!",
        #                     notification_type="warning"
        #                 )
        #         except AppLimit.DoesNotExist:
        #             pass
            
        #     updated_apps.append(screen_time.app_name)
        
        # # Update daily summary
        # total_minutes = ScreenTime.objects.filter(
        #     child=child,
        #     date=today
        # ).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        # app_count = ScreenTime.objects.filter(
        #     child=child,
        #     date=today
        # ).count()
        
        # DailyScreenTimeSummary.objects.update_or_create(
        #     child=child,
        #     date=today,
        #     defaults={
        #         'total_minutes': total_minutes,
        #         'app_count': app_count
        #     }
        # )
        
        # return Response({
        #     "success": True,
        #     "updated_apps": updated_apps,
        #     "blocked_apps": blocked_apps,
        #     "exceeded_apps": exceeded_apps,
        #     "total_screen_time_today": total_minutes
        # })
        
             
        


class ScreenTimeListView(generics.ListAPIView):
    """List screen time records with filters"""
    serializer_class = ScreenTimeSerializer

    def get_queryset(self):
        queryset = ScreenTime.objects.all()
        child_id = self.request.query_params.get('child_id')
        date_str = self.request.query_params.get('date')
        app_package = self.request.query_params.get('app_package')
        
        if child_id:
            queryset = queryset.filter(child_id=child_id)
        
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(date=date)
            except ValueError:
                pass
        
        if app_package:
            queryset = queryset.filter(app_package=app_package)
        
        return queryset


class TodayScreenTimeView(views.APIView):
    """Get today's screen time for a child"""
    
    def get(self, request):
        child_id = request.query_params.get('child_id')
        
        if not child_id:
            return Response(
                {"error": "child_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        today = timezone.now().date()
        
        # Get all apps used today
        screen_times = ScreenTime.objects.filter(
            child_id=child_id,
            date=today
        ).select_related('child')
        
        # Get app limits
        app_limits = AppLimit.objects.filter(child_id=child_id)
        app_limits_dict = {
            limit.app_package: limit for limit in app_limits
        }
        
        # Build response
        apps_data = []
        for st in screen_times:
            limit = app_limits_dict.get(st.app_package)
            
            apps_data.append({
                'app_name': st.app_name,
                'app_package': st.app_package,
                'duration_minutes': st.duration_minutes,
                'daily_limit': limit.daily_limit_minutes if limit else None,
                'remaining_minutes': st.get_remaining_time(),
                'is_blocked': limit.is_blocked if limit else False,
                'limit_exceeded': st.is_limit_exceeded(),
                'percentage_used': (
                    (st.duration_minutes / limit.daily_limit_minutes * 100) 
                    if limit and limit.daily_limit_minutes > 0 else 0
                )
            })
        
        # Get daily summary
        summary = DailyScreenTimeSummary.objects.filter(
            child_id=child_id,
            date=today
        ).first()
        
        return Response({
            'date': today,
            'apps': apps_data,
            'total_minutes': summary.total_minutes if summary else 0,
            'app_count': summary.app_count if summary else 0
        })


class WeeklyMonthlyScreenTimeView(views.APIView):
    """Get weekly and monthly screen time summary"""
    
    def get(self, request):
        child_id = request.query_params.get('child_id')
        
        if not child_id:
            return Response(
                {"error": "child_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        today = timezone.now().date()
        week_start = today - timedelta(days=7)
        month_start = today.replace(day=1)
        
        # Weekly data
        weekly_screen_times = ScreenTime.objects.filter(
            child_id=child_id,
            date__gte=week_start,
            date__lte=today
        )
        
        weekly_total = weekly_screen_times.aggregate(
            total=Sum('duration_minutes')
        )['total'] or 0
        
        weekly_by_app = weekly_screen_times.values('app_name', 'app_package').annotate(
            total_minutes=Sum('duration_minutes')
        ).order_by('-total_minutes')
        
        # Monthly data
        monthly_screen_times = ScreenTime.objects.filter(
            child_id=child_id,
            date__gte=month_start,
            date__lte=today
        )
        
        monthly_total = monthly_screen_times.aggregate(
            total=Sum('duration_minutes')
        )['total'] or 0
        
        monthly_by_app = monthly_screen_times.values('app_name', 'app_package').annotate(
            total_minutes=Sum('duration_minutes')
        ).order_by('-total_minutes')
        
        # Daily breakdown for charts
        daily_totals = ScreenTime.objects.filter(
            child_id=child_id,
            date__gte=week_start,
            date__lte=today
        ).values('date').annotate(
            total_minutes=Sum('duration_minutes')
        ).order_by('date')
        
        return Response({
            'weekly': {
                'total_minutes': weekly_total,
                'total_hours': round(weekly_total / 60, 1),
                'apps': list(weekly_by_app)
            },
            'monthly': {
                'total_minutes': monthly_total,
                'total_hours': round(monthly_total / 60, 1),
                'apps': list(monthly_by_app)
            },
            'daily_breakdown': list(daily_totals)
        })


class CheckAppAccessView(views.APIView):
    """Check if an app should be blocked"""
    
    def post(self, request):
        child_id = request.data.get('child_id')
        app_package = request.data.get('app_package')
        
        if not child_id or not app_package:
            return Response(
                {"error": "child_id and app_package are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        today = timezone.now().date()
        
        # Check if app is blocked
        try:
            app_limit = AppLimit.objects.get(
                child_id=child_id,
                app_package=app_package
            )
            
            if app_limit.is_blocked:
                return Response({
                    'allowed': False,
                    'reason': 'App is blocked',
                    'message': f'{app_limit.app_name} has been blocked by parent'
                })
            
            # Check if daily limit exceeded
            try:
                screen_time = ScreenTime.objects.get(
                    child_id=child_id,
                    app_package=app_package,
                    date=today
                )
                
                if screen_time.duration_minutes >= app_limit.daily_limit_minutes:
                    return Response({
                        'allowed': False,
                        'reason': 'Daily limit exceeded',
                        'message': f'{app_limit.app_name} has reached its daily limit of {app_limit.daily_limit_minutes} minutes',
                        'used_minutes': screen_time.duration_minutes,
                        'limit_minutes': app_limit.daily_limit_minutes
                    })
                
                return Response({
                    'allowed': True,
                    'remaining_minutes': app_limit.daily_limit_minutes - screen_time.duration_minutes,
                    'used_minutes': screen_time.duration_minutes,
                    'limit_minutes': app_limit.daily_limit_minutes
                })
                
            except ScreenTime.DoesNotExist:
                return Response({
                    'allowed': True,
                    'remaining_minutes': app_limit.daily_limit_minutes,
                    'used_minutes': 0,
                    'limit_minutes': app_limit.daily_limit_minutes
                })
        
        except AppLimit.DoesNotExist:
            return Response({
                'allowed': True,
                'message': 'No limit set for this app'
            })




