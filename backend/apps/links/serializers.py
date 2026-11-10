from rest_framework import serializers

from .models import Link


class LinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = [
            "id",
            "title",
            "url",
            "description",
            "icon",
            "position",
            "is_active",
            "clicks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "clicks", "created_at", "updated_at"]


class LinkReorderSerializer(serializers.Serializer):
    """Body: {"ids": [3, 1, 2]} — new order for the current user's links."""

    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), allow_empty=False, max_length=200
    )
