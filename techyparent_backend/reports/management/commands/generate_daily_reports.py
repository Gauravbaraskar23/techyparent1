from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Child
from reports.models import DailyReport
from screentime.models import DailyScreenTimeSummary
from learningsuggestions.models import LearningSuggestion 
from goals.models import Goal

class Command(BaseCommand):
    help = 'Generate daily reports for all children'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        
        for child in Child.objects.all():
            # Get today's data
            summary = DailyScreenTimeSummary.objects.filter(
                child=child,
                date=today
            ).first()
            
            # Learning (use LearningSuggestion instead of VideoView)
            learning_completed = LearningSuggestion.objects.filter(
                child=child,
                status='completed',
                completed_at__date=today
            ).count()
            
            goals = Goal.objects.filter(
                child=child,
                is_completed=True,
                completed_at__date=today
            ).count()
            
            # Create report
            DailyReport.objects.update_or_create(
                child=child,
                date=today,
                defaults={
                    'total_screen_time_minutes': summary.total_minutes if summary else 0,
                    'apps_used_count': summary.app_count if summary else 0,
                    'learning_suggestions_completed': learning_completed,
                    'goals_achieved': goals,
                    'engagement_score': min(100, learning_completed * 15 + goals * 25)
                }
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Generated reports for {Child.objects.count()} children')
        )