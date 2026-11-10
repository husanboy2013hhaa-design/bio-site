from django.utils import timezone
from rest_framework import serializers

from .models import Profile, Report, Theme, UsernameHistory


class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = [
            "preset",
            "background",
            "text_color",
            "button_color",
            "button_text_color",
            "button_style",
            "font",
            "background_image",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class ProfileSerializer(serializers.ModelSerializer):
    theme = ThemeSerializer(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    url = serializers.SerializerMethodField()
    is_minor = serializers.BooleanField(read_only=True)
    can_change_username = serializers.SerializerMethodField()
    username_changes_left = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "slug",
            "kind",
            "display_name",
            "bio",
            "avatar",
            "avatar_url",
            "city",
            "languages",
            "specialty_tags",
            "institution_name",
            "cta_label",
            "cta_url",
            "verified_teacher",
            "parent_consent",
            "birth_year",
            "blocks",
            "privacy",
            "is_public",
            "is_minor",
            "can_change_username",
            "username_changes_left",
            "clicks_total",
            "views_total",
            "email",
            "url",
            "theme",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "verified_teacher",
            "clicks_total",
            "views_total",
            "created_at",
            "updated_at",
        ]

    def get_url(self, obj) -> str:
        from django.conf import settings

        return f"{settings.FRONTEND_URL}/{obj.slug}"

    def get_can_change_username(self, obj) -> bool:
        return obj.can_change_username()

    def get_username_changes_left(self, obj) -> int:
        return max(0, 2 - obj.username_changes_last_14_days())

    def validate_specialty_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Send a list of tags.")
        tags = [str(t).strip()[:30] for t in value if str(t).strip()]
        if len(tags) > 5:
            raise serializers.ValidationError("Pick at most 5 tags.")
        return tags

    def validate_languages(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Send a list of languages.")
        langs = [str(t).strip()[:30] for t in value if str(t).strip()]
        if len(langs) > 10:
            raise serializers.ValidationError("At most 10 languages.")
        return langs

    def validate_slug(self, value):
        instance = self.instance
        if instance and instance.slug == value:
            return value
        if instance and not instance.can_change_username():
            raise serializers.ValidationError(
                "You can change your handle at most twice every 14 days."
            )
        if not Profile.is_slug_available(value):
            raise serializers.ValidationError("This handle is already taken.")
        return value

    def update(self, instance, validated_data):
        new_slug = validated_data.get("slug")
        if new_slug and new_slug != instance.slug:
            old = instance.slug
            UsernameHistory.objects.get_or_create(slug=old)
            history = list(instance.username_history or [])
            history.append(timezone.now().isoformat())
            instance.username_history = history
        return super().update(instance, validated_data)


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["reason", "message", "reporter_email"]
        extra_kwargs = {
            "message": {"required": False, "allow_blank": True},
            "reporter_email": {"required": False, "allow_blank": True},
        }


class PublicProfileSerializer(serializers.ModelSerializer):
    theme = ThemeSerializer(read_only=True)
    links = serializers.SerializerMethodField()
    books = serializers.SerializerMethodField()
    indexable = serializers.SerializerMethodField()
    show_full_name = serializers.SerializerMethodField()
    show_city = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "slug",
            "kind",
            "display_name",
            "bio",
            "avatar",
            "avatar_url",
            "city",
            "languages",
            "specialty_tags",
            "institution_name",
            "cta_label",
            "cta_url",
            "verified_teacher",
            "is_public",
            "blocks",
            "indexable",
            "show_full_name",
            "show_city",
            "links",
            "books",
            "theme",
            "updated_at",
        ]

    def _privacy(self, obj):
        return obj.privacy or {}

    def _block_visible(self, obj, key) -> bool:
        blocks = obj.blocks or {}
        return bool((blocks.get(key) or {}).get("visible", True))

    def get_indexable(self, obj) -> bool:
        return bool(self._privacy(obj).get("indexable", True))

    def get_show_full_name(self, obj) -> bool:
        return bool(self._privacy(obj).get("show_full_name", True))

    def get_show_city(self, obj) -> bool:
        return bool(self._privacy(obj).get("show_city", True))

    def get_links(self, obj):
        if not self._block_visible(obj, "links"):
            return []
        from apps.links.serializers import LinkSerializer

        qs = obj.links.filter(is_active=True).order_by("position")
        return LinkSerializer(qs, many=True).data

    def get_books(self, obj):
        if not self._block_visible(obj, "books"):
            return []
        from apps.books.serializers import BookSerializer

        qs = obj.books.all().order_by("position", "id")
        return BookSerializer(qs, many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not self.get_show_city(instance):
            data["city"] = ""
        if not self.get_show_full_name(instance):
            name = data.get("display_name") or ""
            data["display_name"] = name.split(" ")[0] if name else name
        return data
