from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from apps.profiles.models import Profile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        if not Profile.is_slug_available(slugify(value) or ""):
            raise serializers.ValidationError("This username is taken or reserved.")
        return value

    def create(self, validated_data):
        # Profile + Theme are auto-created by a post_save signal on User
        return User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "date_joined"]
        read_only_fields = fields
