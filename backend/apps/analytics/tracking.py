import hashlib
import os
from urllib.parse import urlparse


def device_from_ua(user_agent: str) -> str:
    ua = (user_agent or "").lower()
    if "ipad" in ua or "tablet" in ua:
        return "tablet"
    if "mobi" in ua or "android" in ua or "iphone" in ua:
        return "mobile"
    return "desktop"


def source_from_request(request, explicit: str = "") -> str:
    if explicit:
        return explicit[:60]
    query_source = request.GET.get("utm_source") or request.GET.get("ref")
    if query_source:
        return query_source[:60]
    referrer = request.META.get("HTTP_REFERER", "")
    if referrer:
        host = urlparse(referrer).netloc.replace("www.", "")
        if host:
            return host[:60]
    return "direct"


def location_from_request(request):
    city = (
        request.META.get("HTTP_X_VERCEL_IP_CITY")
        or request.META.get("HTTP_CF_IPCITY")
        or ""
    )
    country = (
        request.META.get("HTTP_X_VERCEL_IP_COUNTRY")
        or request.META.get("HTTP_CF_IPCOUNTRY")
        or ""
    )
    return city[:80], country[:2].upper()


def hash_ip(request) -> str:
    raw_ip = request.META.get("REMOTE_ADDR", "")
    salt = os.getenv("CLICK_HASH_SALT", "change-me-in-production")
    return hashlib.sha256(f"{salt}:{raw_ip}".encode()).hexdigest() if raw_ip else ""


def record_event(request, profile, event_type, link=None, source="", slot=""):
    from .models import Event

    city, country = location_from_request(request)
    return Event.objects.create(
        profile=profile,
        link=link,
        event_type=event_type,
        source=source_from_request(request, source),
        slot=(slot or "")[:60],
        device=device_from_ua(request.META.get("HTTP_USER_AGENT", "")),
        city=city,
        country=country,
        referrer=(request.META.get("HTTP_REFERER") or "")[:255],
    )
