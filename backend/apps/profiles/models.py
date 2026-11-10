from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def validate_hex_color(value: str) -> None:
    if not value.startswith("#") or len(value) not in (4, 7):
        raise ValidationError("Color must be a hex value like #fff or #1a2b3c.")


RESERVED_SLUGS = {
    "admin",
    "administrator",
    "api",
    "static",
    "media",
    "dashboard",
    "login",
    "logout",
    "signup",
    "register",
    "help",
    "support",
    "settings",
    "claim",
    "kind",
    "theme",
    "edit",
    "analytics",
    "profile",
    "public",
    "about",
    "terms",
    "privacy",
    "blog",
    "docs",
    "status",
    "app",
    "www",
    "mail",
    "ilmbio",
    "ilm",
    "ilmlan",
    "ilmpanel",
    "ilmmaps",
    "ilmdesk",
    "ilmtips",
    "ilmguide",
    "ilmbase",
    "ilmfan",
    "ilmmate",
    "ilmprep",
}


def default_blocks():
    return {
        "links": {"visible": True, "position": 1},
        "books": {"visible": True, "position": 2},
        "courses": {"visible": True, "position": 3},
        "certificates": {"visible": True, "position": 4},
    }


def default_privacy():
    return {
        "show_full_name": True,
        "show_city": True,
        "show_scores": False,
        "indexable": True,
    }


class Profile(models.Model):
    class Kind(models.TextChoices):
        TEACHER = "teacher", "Teacher"
        STUDENT = "student", "Student"
        BOTH = "both", "Teacher & student"
        INSTITUTION = "institution", "Institution"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    slug = models.SlugField(
        max_length=40, unique=True, help_text="Public URL handle: /<slug>"
    )
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.STUDENT)
    display_name = models.CharField(max_length=60, blank=True)
    bio = models.CharField(max_length=160, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    city = models.CharField(max_length=80, blank=True)
    languages = models.JSONField(default=list, blank=True)
    specialty_tags = models.JSONField(default=list, blank=True)
    institution_name = models.CharField(max_length=120, blank=True)
    cta_label = models.CharField(max_length=60, blank=True)
    cta_url = models.URLField(max_length=500, blank=True)
    verified_teacher = models.BooleanField(default=False)
    parent_consent = models.BooleanField(default=False)
    birth_year = models.PositiveIntegerField(null=True, blank=True)
    blocks = models.JSONField(default=default_blocks, blank=True)
    privacy = models.JSONField(default=default_privacy, blank=True)
    username_history = models.JSONField(default=list, blank=True)
    is_public = models.BooleanField(default=True)
    clicks_total = models.BigIntegerField(default=0)
    views_total = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.slug

    @property
    def is_minor(self) -> bool:
        if not self.birth_year:
            return False
        return (timezone.now().year - self.birth_year) < 18

    def username_changes_last_14_days(self) -> int:
        cutoff = timezone.now() - timezone.timedelta(days=14)
        count = 0
        for raw in self.username_history or []:
            try:
                when = timezone.datetime.fromisoformat(raw)
            except (TypeError, ValueError):
                continue
            if timezone.is_naive(when):
                when = timezone.make_aware(when)
            if when >= cutoff:
                count += 1
        return count

    def can_change_username(self) -> bool:
        return self.username_changes_last_14_days() < 2

    @staticmethod
    def is_slug_available(slug: str) -> bool:
        if slug in RESERVED_SLUGS:
            return False
        if Profile.objects.filter(slug=slug).exists():
            return False
        if UsernameHistory.objects.filter(slug=slug).exists():
            return False
        return True

    @classmethod
    def make_unique_slug(cls, base: str) -> str:
        base = slugify(base)[:32] or "user"
        candidate, i = base, 1
        while not cls.is_slug_available(candidate):
            i += 1
            candidate = f"{base}-{i}"
        return candidate

    def clean(self):
        if self.slug and not self.is_slug_available(self.slug):
            raise ValidationError({"slug": "This handle is already taken."})


class UsernameHistory(models.Model):
    """Released handles stay blocked so old links never point at someone else."""

    slug = models.SlugField(max_length=40, unique=True)
    released_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.slug


class Theme(models.Model):
    class ButtonStyle(models.TextChoices):
        SQUARE = "square", "Square"
        ROUNDED = "rounded", "Rounded"
        PILL = "pill", "Pill"
        SOFT = "soft", "Soft"
        OUTLINE = "outline", "Outline"
        NEON = "neon", "Neon"

    class Font(models.TextChoices):
        INTER = "Inter", "Inter"
        SYSTEM = "system", "System"
        SERIF = "serif", "Serif"
        MONO = "mono", "Mono"

    class Preset(models.TextChoices):
        NONE = "none", "Plain (custom colors)"
        DOSKA = "doska", "Chalkboard"
        BOOKSHELF = "bookshelf", "Bookshelf"
        LAB = "lab", "Laboratory"
        NOTEBOOK = "notebook", "Notebook"
        MAP = "map", "Old map"
        SPACE = "space", "Space"
        TERMINAL = "terminal", "Terminal"
        LIBRARY = "library", "Library cards"
        MINIMAL = "minimal", "Minimal"
        NATURE = "nature", "Garden"

    profile = models.OneToOneField(
        Profile, on_delete=models.CASCADE, related_name="theme"
    )
    preset = models.CharField(max_length=12, choices=Preset.choices, default=Preset.NONE)
    background = models.CharField(max_length=7, default="#0f172a", validators=[validate_hex_color])
    text_color = models.CharField(max_length=7, default="#f8fafc", validators=[validate_hex_color])
    button_color = models.CharField(max_length=7, default="#22c55e", validators=[validate_hex_color])
    button_text_color = models.CharField(max_length=7, default="#052e16", validators=[validate_hex_color])
    button_style = models.CharField(
        max_length=10, choices=ButtonStyle.choices, default=ButtonStyle.PILL
    )
    font = models.CharField(max_length=10, choices=Font.choices, default=Font.INTER)
    background_image = models.ImageField(upload_to="themes/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Theme({self.profile.slug})"


class Report(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWING = "reviewing", "Reviewing"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="reports")
    reason = models.CharField(max_length=40)
    message = models.TextField(blank=True)
    reporter_email = models.EmailField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report({self.profile.slug}, {self.reason})"
