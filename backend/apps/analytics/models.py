from django.db import models

from apps.links.models import Link
from apps.profiles.models import Profile


class DailyStat(models.Model):
    """Materialised daily rollup — keeps analytics queries fast on large accounts."""

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="daily_stats")
    link = models.ForeignKey(
        Link, on_delete=models.CASCADE, related_name="daily_stats", null=True, blank=True
    )
    date = models.DateField()
    clicks = models.PositiveIntegerField(default=0)
    views = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "link", "date"], name="unique_daily_stat"
            ),
        ]
        indexes = [models.Index(fields=["profile", "date"])]

    def __str__(self):
        scope = f"link:{self.link_id}" if self.link_id else "profile"
        return f"{scope} {self.date} clicks={self.clicks}"


class Event(models.Model):
    """Raw view/click event with traffic attribution (source, slot, device, city)."""

    class Type(models.TextChoices):
        VIEW = "view", "Profile view"
        CLICK = "click", "Link click"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="events")
    link = models.ForeignKey(
        Link, on_delete=models.CASCADE, related_name="events", null=True, blank=True
    )
    event_type = models.CharField(max_length=10, choices=Type.choices)
    source = models.CharField(max_length=60, blank=True)
    slot = models.CharField(max_length=60, blank=True)
    device = models.CharField(max_length=12, blank=True)
    city = models.CharField(max_length=80, blank=True)
    country = models.CharField(max_length=2, blank=True)
    referrer = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["profile", "event_type", "created_at"]),
            models.Index(fields=["link", "created_at"], name="event_link_created_idx"),
        ]

    def __str__(self):
        return f"{self.event_type} on {self.profile_id}"
