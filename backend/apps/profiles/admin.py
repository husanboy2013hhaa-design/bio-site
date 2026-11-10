from django.contrib import admin

from .models import Profile, Report, Theme


class ThemeInline(admin.StackedInline):
    model = Theme
    can_delete = False


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("slug", "display_name", "is_public", "clicks_total", "views_total", "created_at")
    search_fields = ("slug", "display_name", "user__email")
    list_filter = ("is_public",)
    inlines = [ThemeInline]


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ("profile", "preset", "button_style", "font", "background")
    list_filter = ("preset", "button_style", "font")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("profile", "reason", "status", "created_at")
    list_filter = ("reason", "status")
    search_fields = ("profile__slug", "message")
