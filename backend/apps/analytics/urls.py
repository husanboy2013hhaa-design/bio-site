from django.urls import path

from .views import AnalyticsExportView, AnalyticsOverviewView

urlpatterns = [
    path("analytics/overview/", AnalyticsOverviewView.as_view(), name="analytics-overview"),
    path("analytics/export.csv", AnalyticsExportView.as_view(), name="analytics-export"),
]
