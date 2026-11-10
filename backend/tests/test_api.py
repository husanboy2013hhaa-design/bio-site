from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.profiles.models import Profile

User = get_user_model()


class AuthTests(APITestCase):
    def test_register_creates_user_profile_theme(self):
        url = reverse("auth-register")
        resp = self.client.post(
            url,
            {"email": "Ali@Example.com", "username": "ali", "password": "S3cure-pass!"},
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertIn("access", resp.data)
        profile = Profile.objects.get(slug="ali")
        self.assertTrue(hasattr(profile, "theme"))

    def test_register_rejects_taken_username(self):
        self.client.post(
            reverse("auth-register"),
            {"email": "a@b.com", "username": "ali", "password": "S3cure-pass!"},
        )
        resp = self.client.post(
            reverse("auth-register"),
            {"email": "c@d.com", "username": "ali", "password": "S3cure-pass!"},
        )
        self.assertEqual(resp.status_code, 400)

    def test_login_returns_jwt(self):
        self.client.post(
            reverse("auth-register"),
            {"email": "a@b.com", "username": "ali", "password": "S3cure-pass!"},
        )
        resp = self.client.post(
            reverse("auth-login"), {"email": "a@b.com", "password": "S3cure-pass!"}
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn("access", resp.data)


class LinkTests(APITestCase):
    def setUp(self):
        resp = self.client.post(
            reverse("auth-register"),
            {"email": "a@b.com", "username": "ali", "password": "S3cure-pass!"},
        )
        self.token = resp.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_link_crud_and_ownership(self):
        resp = self.client.post(
            reverse("link-list"),
            {"title": "YouTube", "url": "https://youtube.com/@ali"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        link_id = resp.data["id"]

        resp = self.client.patch(
            reverse("link-detail", args=[link_id]), {"title": "YT"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["title"], "YT")

        resp = self.client.delete(reverse("link-detail", args=[link_id]))
        self.assertEqual(resp.status_code, 204)

    def test_invalid_url_rejected(self):
        resp = self.client.post(
            reverse("link-list"), {"title": "X", "url": "ftp://bad"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)

    def test_reorder(self):
        ids = []
        for i in range(3):
            resp = self.client.post(
                reverse("link-list"),
                {"title": f"L{i}", "url": f"https://example.com/{i}"},
                format="json",
            )
            ids.append(resp.data["id"])
        resp = self.client.patch(
            reverse("link-reorder"), {"ids": list(reversed(ids))}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual([l["id"] for l in resp.data], list(reversed(ids)))


class PublicProfileTests(APITestCase):
    def test_public_profile_and_click_tracking(self):
        self.client.post(
            reverse("auth-register"),
            {"email": "a@b.com", "username": "ali", "password": "S3cure-pass!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION="Bearer unused")
        # Create link via a second authenticated call
        self.client.credentials()
        login = self.client.post(
            reverse("auth-login"), {"email": "a@b.com", "password": "S3cure-pass!"}
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        resp = self.client.post(
            reverse("link-list"),
            {"title": "Site", "url": "https://example.com"},
            format="json",
        )
        link_id = resp.data["id"]

        public = self.client.get(reverse("public-profile", args=["ali"]))
        self.assertEqual(public.status_code, 200, public.data)
        self.assertEqual(len(public.data["links"]), 1)

        click = self.client.post(reverse("link-click", args=[link_id]))
        self.assertEqual(click.status_code, 201)
        self.client.credentials()
        public = self.client.get(reverse("public-profile", args=["ali"]))
        self.assertEqual(public.data["links"][0]["clicks"], 1)

class AutoProfileTests(TestCase):
    def test_createsuperuser_gets_profile_and_theme(self):
        User.objects.create_superuser(email="admin@example.com", username="@ish", password="S3cure-pass!")
        profile = Profile.objects.get(user__email="admin@example.com")
        self.assertEqual(profile.slug, "ish")
        self.assertTrue(hasattr(profile, "theme"))

    def test_plain_user_gets_profile(self):
        user = User.objects.create_user(email="a@b.com", username="ali", password="S3cure-pass!")
        self.assertTrue(Profile.objects.filter(user=user, slug="ali").exists())
