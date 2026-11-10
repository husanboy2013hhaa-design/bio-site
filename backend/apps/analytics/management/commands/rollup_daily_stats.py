from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Count
from django.utils import timezone

from apps.analytics.models import DailyStat
from apps.links.models import ClickEvent


class Command(BaseCommand):
    help = "Roll raw ClickEvent rows up into DailyStat rows (run nightly via cron)."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=7)

    def handle(self, *args, **options):
        start = timezone.now().date() - timedelta(days=options["days"])
        rows = (
            ClickEvent.objects.filter(created_at__date__gte=start)
            .values("link__profile_id", "link_id", "created_at__date")
            .annotate(clicks=Count("id"))
        )
        created = 0
        for row in rows:
            DailyStat.objects.update_or_create(
                profile_id=row["link__profile_id"],
                link_id=row["link_id"],
                date=row["created_at__date"],
                defaults={"clicks": row["clicks"]},
            )
            created += 1
        self.stdout.write(self.style.SUCCESS(f"Rolled up {created} daily stat rows."))
