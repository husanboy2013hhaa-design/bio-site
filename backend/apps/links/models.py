from urllib.parse import urlparse

from django.core.exceptions import ValidationError
from django.db import models

from apps.profiles.models import Profile


def validate_http_url(value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValidationError("URL must start with http:// or https:// and include a host.")


class Link(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="links")
    title = models.CharField(max_length=80)
    url = models.URLField(max_length=500, validators=[validate_http_url])
    description = models.CharField(max_length=160, blank=True)
    icon = models.CharField(
        max_length=40, blank=True, help_text="Optional icon key, e.g. instagram, youtube."
    )
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    clicks = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "position"], name="unique_link_position_per_profile"
            ),
            models.CheckConstraint(
                condition=models.Q(position__gte=0), name="link_position_non_negative"
            ),
        ]
        indexes = [models.Index(fields=["profile", "is_active", "position"])]

    def __str__(self):
        return f"{self.title} -> {self.url}"


class ClickEvent(models.Model):
    link = models.ForeignKey(Link, on_delete=models.CASCADE, related_name="click_events")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    referrer = models.CharField(max_length=255, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    ip_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="Salted hash of the IP — never store raw IPs (GDPR).",
    )
    country = models.CharField(max_length=2, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["link", "created_at"], name="click_link_created_idx"),
        ]

    def __str__(self):
        return f"Click on link #{self.link_id}"
