import csv
from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.models import Event
from apps.links.models import Link


def _breakdown(qs, field):
    return [
        {field: row[field] or "unknown", "count": row["count"]}
        for row in qs.values(field).annotate(count=Count("id")).order_by("-count")[:8]
    ]


class AnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        since = timezone.now() - timedelta(days=30)

        totals = Link.objects.filter(profile=profile).aggregate(
            total_clicks=Sum("clicks"), total_links=Count("id")
        )
        events = Event.objects.filter(profile=profile, created_at__gte=since)

        daily_map = {}
        for row in (
            events.annotate(day=TruncDate("created_at"))
            .values("day", "event_type")
            .annotate(count=Count("id"))
        ):
            day = row["day"].isoformat()
            bucket = daily_map.setdefault(day, {"date": day, "views": 0, "clicks": 0})
            bucket[row["event_type"] + "s"] = row["count"]
        daily = [daily_map[k] for k in sorted(daily_map)]

        top_links = (
            Link.objects.filter(profile=profile)
            .order_by("-clicks")[:5]
            .values("id", "title", "url", "clicks")
        )
        return Response(
            {
                "total_clicks": totals["total_clicks"] or 0,
                "total_links": totals["total_links"] or 0,
                "profile_views": profile.views_total,
                "daily": daily,
                "top_links": list(top_links),
                "sources": _breakdown(
                    events.filter(event_type=Event.Type.CLICK), "source"
                ),
                "devices": _breakdown(events, "device"),
                "cities": _breakdown(events.exclude(city=""), "city"),
                "countries": _breakdown(events.exclude(country=""), "country"),
            }
        )


class AnalyticsExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        since = timezone.now() - timedelta(days=90)
        events = Event.objects.filter(profile=profile, created_at__gte=since)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="{profile.slug}-analytics.csv"'
        )
        writer = csv.writer(response)
        writer.writerow(["date", "type", "link", "source", "slot", "device", "city", "country", "count"])
        rows = (
            events.annotate(day=TruncDate("created_at"))
            .values("day", "event_type", "link__title", "source", "slot", "device", "city", "country")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        for row in rows:
            writer.writerow(
                [
                    row["day"],
                    row["event_type"],
                    row["link__title"] or "",
                    row["source"],
                    row["slot"],
                    row["device"],
                    row["city"],
                    row["country"],
                    row["count"],
                ]
            )
        return response
