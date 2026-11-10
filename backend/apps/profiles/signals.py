from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify

from .models import Profile, Theme

User = get_user_model()


@receiver(post_save, sender=User)
def create_profile_for_user(sender, instance, created, **kwargs):
    """Every user gets a Profile + Theme, however they were created
    (API register, createsuperuser, admin, shell)."""
    if created:
        Profile.objects.get_or_create(
            user=instance,
            defaults={
                "slug": Profile.make_unique_slug(slugify(instance.username) or "user"),
                "display_name": instance.username,
            },
        )


@receiver(post_save, sender=Profile)
def create_theme_for_profile(sender, instance, created, **kwargs):
    if created:
        Theme.objects.get_or_create(profile=instance)
