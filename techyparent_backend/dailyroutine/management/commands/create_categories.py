from django.core.management.base import BaseCommand
from dailyroutine.models import RoutineCategory

class Command(BaseCommand):
    help = 'Create default routine categories'

    def handle(self, *args, **kwargs):
        categories = [
            ('morning', 'Morning Routine', 'sunny-outline', '#f59e0b', 1),
            ('school', 'School Time', 'school-outline', '#3b82f6', 2),
            ('afternoon', 'Afternoon', 'partly-sunny-outline', '#10b981', 3),
            ('evening', 'Evening', 'moon-outline', '#8b5cf6', 4),
            ('night', 'Night Routine', 'bed-outline', '#6366f1', 5),
            ('meals', 'Meals', 'restaurant-outline', '#ef4444', 6),
            ('play', 'Play Time', 'game-controller-outline', '#ec4899', 7),
            ('study', 'Study Time', 'book-outline', '#06b6d4', 8),
            ('other', 'Other', 'ellipsis-horizontal', '#9ca3af', 9),
        ]
        
        for name, display_name, icon, color, order in categories:
            RoutineCategory.objects.get_or_create(
                name=name,
                defaults={
                    'display_name': display_name,
                    'icon_name': icon,
                    'color': color,
                    'order': order
                }
            )
        
        self.stdout.write(self.style.SUCCESS('Created categories successfully'))