from django.db import migrations
from django.utils.text import slugify

RESERVED = {"admin", "api", "static", "media", "dashboard", "login", "register"}


def unique_slug(Profile, base: str) -> str:
    base = (base or "user")[:32]
    candidate, i = base, 1
    while Profile.objects.filter(slug=candidate).exists() or candidate in RESERVED:
        i += 1
        candidate = f"{base}-{i}"
    return candidate


def backfill(apps, schema_editor):
    """Users created before the auto-profile signal (e.g. createsuperuser)."""
    User = apps.get_model("accounts", "User")
    Profile = apps.get_model("profiles", "Profile")
    Theme = apps.get_model("profiles", "Theme")

    for user in User.objects.filter(profile__isnull=True).iterator():
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={
                "slug": unique_slug(Profile, slugify(user.username)),
                "display_name": user.username,
            },
        )
        Theme.objects.get_or_create(profile=profile)


def unbackfill(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")
    Profile.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("profiles", "0001_initial"),
    ]

    operations = [migrations.RunPython(backfill, unbackfill)]
