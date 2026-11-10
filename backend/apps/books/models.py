from django.db import models

from apps.profiles.models import Profile


class Book(models.Model):
    class Status(models.TextChoices):
        READ = "read", "Read"
        READING = "reading", "Reading"
        WANT = "want", "Want to read"
        WISHLIST = "wishlist", "Wishlist"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="books")
    title = models.CharField(max_length=160)
    author = models.CharField(max_length=120, blank=True)
    cover_url = models.URLField(max_length=500, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.READING)
    rating = models.PositiveSmallIntegerField(default=0, help_text="0-5 stars")
    note = models.CharField(max_length=240, blank=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]
        indexes = [models.Index(fields=["profile", "status", "position"])]

    def __str__(self):
        return f"{self.title} ({self.status})"
