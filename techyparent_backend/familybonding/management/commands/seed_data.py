from django.core.management.base import BaseCommand
from familybonding.models import ActivityCategory, ActivityTemplate


class Command(BaseCommand):
    help = "Seed default categories and templates"

    def handle(self, *args, **kwargs):
        categories = [
            ("outdoor", "Outdoor Activities"),
            ("indoor", "Indoor Games"),
            ("creative", "Creative & Arts"),
            ("educational", "Educational"),
            ("sports", "Sports & Fitness"),
            ("cooking", "Cooking Together"),
            ("movie", "Movie & Entertainment"),
        ]

        cat_objs = {}
        for name, display in categories:
            cat, _ = ActivityCategory.objects.get_or_create(
                name=name,
                defaults={"display_name": display}
            )
            cat_objs[name] = cat

        # Templates
        ActivityTemplate.objects.get_or_create(
            title="Family Movie Night",
            defaults={
                "description": "Watch a movie together",
                "category": cat_objs["movie"],
                "duration_minutes": 120,
                "difficulty": "easy",
                "instructions": "Pick a movie and enjoy",
                "is_outdoor": False
            }
        )

        ActivityTemplate.objects.get_or_create(
            title="Park Picnic",
            defaults={
                "description": "Go to park and enjoy",
                "category": cat_objs["outdoor"],
                "duration_minutes": 90,
                "difficulty": "easy",
                "instructions": "Bring food and games",
                "is_outdoor": True
            }
        )

        self.stdout.write(self.style.SUCCESS("✅ Data Seeded Successfully"))