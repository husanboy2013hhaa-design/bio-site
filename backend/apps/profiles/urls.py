from django.urls import path

from .views import (
    AvatarUploadView,
    IlmlanWebhookView,
    ProfileMeView,
    PublicProfileView,
    PublicReportView,
    PublicSitemapView,
    ThemeView,
)

urlpatterns = [
    path("profile/me/", ProfileMeView.as_view(), name="profile-me"),
    path("profile/me/avatar/", AvatarUploadView.as_view(), name="profile-avatar"),
    path("theme/", ThemeView.as_view(), name="theme"),
    path("public/sitemap/", PublicSitemapView.as_view(), name="public-sitemap"),
    path("public/<slug:slug>/report/", PublicReportView.as_view(), name="public-report"),
    path("public/<slug:slug>/", PublicProfileView.as_view(), name="public-profile"),
    path("webhooks/ilmlan/", IlmlanWebhookView.as_view(), name="ilmlan-webhook"),
]
