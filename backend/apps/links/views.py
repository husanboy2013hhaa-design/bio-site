import hashlib
import os

from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.profiles.models import Profile

from .models import ClickEvent, Link
from .serializers import LinkReorderSerializer, LinkSerializer


def owned_link_or_404(user, pk):
    try:
        return Link.objects.get(pk=pk, profile=user.profile)
    except Link.DoesNotExist:
        from django.http import Http404

        raise Http404


class LinkListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = request.user.profile.links.all()
        return Response(LinkSerializer(qs, many=True).data)

    def post(self, request):
        serializer = LinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.profile
        last_position = profile.links.order_by("-position").values_list("position", flat=True).first()
        link = serializer.save(profile=profile, position=(last_position or 0) + 1)
        return Response(LinkSerializer(link).data, status=status.HTTP_201_CREATED)


class LinkDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        link = owned_link_or_404(request.user, pk)
        serializer = LinkSerializer(link, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        link = owned_link_or_404(request.user, pk)
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LinkReorderView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = LinkReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data["ids"]
        profile = request.user.profile
        links = {l.pk: l for l in profile.links.all()}
        if set(ids) != set(links.keys()):
            return Response(
                {"detail": "ids must contain exactly the caller's link ids."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            # Two-phase update to avoid collisions with the unique (profile, position) constraint
            base = 1_000_000
            for offset, link_id in enumerate(ids):
                Link.objects.filter(pk=link_id).update(position=base + offset)
            for position, link_id in enumerate(ids):
                Link.objects.filter(pk=link_id).update(position=position)
        return Response(LinkSerializer(profile.links.all(), many=True).data)


class LinkClickView(APIView):
    """Records a click on a link. Used by the public profile page."""

    authentication_classes = [JWTAuthentication]  # optional — public visitors pass no token
    permission_classes = []
    throttle_classes = [UserRateThrottle]

    def post(self, request, pk):
        try:
            link = Link.objects.select_related("profile").get(pk=pk, is_active=True)
        except Link.DoesNotExist:
            from django.http import Http404

            raise Http404

        if not link.profile.is_public:
            from django.http import Http404

            raise Http404

        raw_ip = request.META.get("REMOTE_ADDR", "")
        salt = os.getenv("CLICK_HASH_SALT", "change-me-in-production")
        ip_hash = hashlib.sha256(f"{salt}:{raw_ip}".encode()).hexdigest() if raw_ip else ""

        from apps.analytics.tracking import record_event

        with transaction.atomic():
            ClickEvent.objects.create(
                link=link,
                referrer=(request.META.get("HTTP_REFERER") or "")[:255],
                user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:255],
                ip_hash=ip_hash,
            )
            record_event(
                request,
                link.profile,
                "click",
                link=link,
                source=str(request.data.get("source") or ""),
                slot=str(request.data.get("slot") or ""),
            )
            Link.objects.filter(pk=link.pk).update(clicks=F("clicks") + 1)
            Profile.objects.filter(pk=link.profile_id).update(
                clicks_total=F("clicks_total") + 1
            )
        return Response({"detail": "clicked"}, status=status.HTTP_201_CREATED)
