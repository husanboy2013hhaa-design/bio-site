import json
import os
import uuid
from urllib import error, request as urlrequest

from django.conf import settings
from django.db.models import F
from django.http import Http404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.analytics.tracking import record_event

from .models import Profile, Report
from .serializers import ProfileSerializer, PublicProfileSerializer, ReportSerializer, ThemeSerializer

ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


class ProfileMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user.profile).data)

    def patch(self, request):
        serializer = ProfileSerializer(
            request.user.profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        if (
            "kind" in request.data
            and profile.kind == Profile.Kind.STUDENT
            and not profile.parent_consent
            and "is_public" not in request.data
        ):
            profile.is_public = False
            profile.privacy = {**(profile.privacy or {}), "indexable": False}
            profile.save(update_fields=["is_public", "privacy"])
        return Response(ProfileSerializer(request.user.profile).data)


class AvatarUploadView(APIView):
    """Stores avatars in Supabase Storage (Vercel's filesystem is ephemeral)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        upload = request.FILES.get("avatar")
        if not upload:
            return Response({"detail": "No file sent."}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > MAX_AVATAR_BYTES:
            return Response(
                {"detail": "Avatar must be under 5 MB."}, status=status.HTTP_400_BAD_REQUEST
            )
        ext = os.path.splitext(upload.name or "")[1].lower()
        if ext not in ALLOWED_IMAGE_EXT or not (upload.content_type or "").startswith("image/"):
            return Response(
                {"detail": "Only PNG, JPG, WEBP or GIF images are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        supabase_url = (
            os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL") or ""
        ).rstrip("/")
        service_key = os.getenv("DATABASE_SERVICE_ROLE_KEY") or os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY"
        )
        if not supabase_url or not service_key:
            return Response(
                {"detail": "Avatar storage is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        profile = request.user.profile
        path = f"{profile.slug}/{uuid.uuid4().hex}{ext}"
        endpoint = f"{supabase_url}/storage/v1/object/avatars/{path}"
        req = urlrequest.Request(
            endpoint,
            data=upload.read(),
            method="PUT",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": upload.content_type or "application/octet-stream",
                "x-upsert": "true",
                "cache-control": "3600",
            },
        )
        try:
            with urlrequest.urlopen(req, timeout=20) as resp:
                if resp.status not in (200, 201):
                    raise error.URLError(f"status {resp.status}")
        except (error.URLError, error.HTTPError, OSError) as exc:
            return Response(
                {"detail": f"Upload failed: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        public_url = f"{supabase_url}/storage/v1/object/public/avatars/{path}"
        profile.avatar_url = public_url
        profile.save(update_fields=["avatar_url", "updated_at"])
        return Response({"avatar_url": public_url})


class ThemeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ThemeSerializer(request.user.profile.theme).data)

    def patch(self, request):
        serializer = ThemeSerializer(
            request.user.profile.theme, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ThemeSerializer(request.user.profile.theme).data)


class PublicProfileView(APIView):
    permission_classes = []
    throttle_classes = [AnonRateThrottle]

    def get(self, request, slug):
        try:
            profile = (
                Profile.objects.select_related("theme", "user")
                .prefetch_related("links", "books")
                .get(slug=slug, is_public=True)
            )
        except Profile.DoesNotExist:
            raise Http404("Profile not found")

        Profile.objects.filter(pk=profile.pk).update(views_total=F("views_total") + 1)
        record_event(request, profile, "view")
        return Response(PublicProfileSerializer(profile).data)


class PublicReportView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, slug):
        try:
            profile = Profile.objects.get(slug=slug, is_public=True)
        except Profile.DoesNotExist:
            raise Http404("Profile not found")
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile=profile)
        return Response({"detail": "Thanks — we will review this page."}, status=201)


class PublicSitemapView(APIView):
    permission_classes = []

    def get(self, request):
        rows = Profile.objects.filter(is_public=True).values("slug", "privacy", "updated_at")
        items = [
            {"slug": row["slug"], "updated_at": row["updated_at"]}
            for row in rows
            if (row["privacy"] or {}).get("indexable", True)
        ]
        return Response({"profiles": items})


class IlmlanWebhookView(APIView):
    """Stub webhook: ilmlan notifies us when a teacher publishes a course."""

    permission_classes = [AllowAny]

    def post(self, request):
        secret = os.getenv("ILMLAN_WEBHOOK_SECRET", "dev-secret")
        if request.headers.get("X-Webhook-Secret") != secret:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data if isinstance(request.data, dict) else json.loads(request.body or "{}")
        identifier = payload.get("email") or payload.get("slug") or ""
        try:
            profile = Profile.objects.get(slug=identifier)
        except Profile.DoesNotExist:
            profile = Profile.objects.filter(user__email__iexact=identifier).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        published = int(payload.get("published_courses") or 0)
        profile.verified_teacher = published > 0
        profile.save(update_fields=["verified_teacher", "updated_at"])
        return Response({"slug": profile.slug, "verified_teacher": profile.verified_teacher})
