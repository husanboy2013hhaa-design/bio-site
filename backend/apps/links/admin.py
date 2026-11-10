from django.contrib import admin

from .models import ClickEvent, Link


@admin.register(Link)
class LinkAdmin(admin.ModelAdmin):
    list_display = ("title", "profile", "is_active", "position", "clicks", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("title", "url", "profile__slug")
    readonly_fields = ("clicks",)


@admin.register(ClickEvent)
class ClickEventAdmin(admin.ModelAdmin):
    list_display = ("link", "created_at", "referrer", "country")
    list_filter = ("created_at",)
    readonly_fields = ("link", "created_at", "referrer", "user_agent", "ip_hash", "country")
