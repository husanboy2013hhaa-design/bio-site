from django.urls import path

from .views import LinkDetailView, LinkListCreateView, LinkReorderView, LinkClickView

urlpatterns = [
    path("links/", LinkListCreateView.as_view(), name="link-list"),
    path("links/reorder/", LinkReorderView.as_view(), name="link-reorder"),
    path("links/<int:pk>/", LinkDetailView.as_view(), name="link-detail"),
    path("links/<int:pk>/click/", LinkClickView.as_view(), name="link-click"),
]
