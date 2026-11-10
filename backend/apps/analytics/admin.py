from django.contrib import admin

from .models import DailyStat


@admin.register(DailyStat)
class DailyStatAdmin(admin.ModelAdmin):
    list_display = ("profile", "link", "date", "clicks", "views")
    list_filter = ("date",)
