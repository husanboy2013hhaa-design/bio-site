from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.books.models import Book
from apps.profiles.models import Profile, Report

User = get_user_model()


class BaseAuth(APITestCase):
    def setUp(self):
        resp = self.client.post(
            "/api/v1/auth/register/",
            {"email": "t@example.com", "username": "ustoz", "password": "S3cure-pass!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        self.profile = Profile.objects.get(slug="ustoz")


class BookTests(BaseAuth):
    def test_book_crud(self):
        resp = self.client.post(
            "/api/v1/books/",
            {"title": "Atomic Habits", "author": "James Clear", "status": "read", "rating": 5},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        book_id = resp.data["id"]
        self.assertTrue(Book.objects.filter(pk=book_id, profile=self.profile).exists())

        resp = self.client.patch(
            f"/api/v1/books/{book_id}/", {"status": "wishlist"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "wishlist")

        resp = self.client.delete(f"/api/v1/books/{book_id}/")
        self.assertEqual(resp.status_code, 204)


class UsernameRuleTests(BaseAuth):
    def test_two_changes_per_14_days(self):
        self.assertEqual(self.client.patch("/api/v1/profile/me/", {"slug": "ustoz-2"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch("/api/v1/profile/me/", {"slug": "ustoz-3"}, format="json").status_code, 200)
        blocked = self.client.patch("/api/v1/profile/me/", {"slug": "ustoz-4"}, format="json")
        self.assertEqual(blocked.status_code, 400, blocked.data)

    def test_reserved_slug_rejected(self):
        resp = self.client.patch("/api/v1/profile/me/", {"slug": "admin"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_released_slug_stays_blocked(self):
        self.client.patch("/api/v1/profile/me/", {"slug": "new-handle"}, format="json")
        other = User.objects.create_user(
            email="other@example.com", username="other", password="S3cure-pass!"
        )
        self.assertFalse(Profile.is_slug_available("ustoz"))
        self.assertNotEqual(other.profile.slug, "ustoz")


class PublicV15Tests(BaseAuth):
    def test_public_profile_exposes_books_and_verified(self):
        self.client.post(
            "/api/v1/books/",
            {"title": "Clean Code", "status": "reading", "rating": 4},
            format="json",
        )
        self.profile.verified_teacher = True
        self.profile.kind = Profile.Kind.TEACHER
        self.profile.save()

        resp = self.client.get("/api/v1/public/ustoz/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["verified_teacher"])
        self.assertEqual(resp.data["kind"], "teacher")
        self.assertEqual(len(resp.data["books"]), 1)

    def test_privacy_hides_city_and_last_name(self):
        self.profile.display_name = "Ali Valiyev"
        self.profile.city = "Toshkent"
        self.profile.privacy = {"show_city": False, "show_full_name": False, "indexable": False}
        self.profile.save()
        resp = self.client.get("/api/v1/public/ustoz/")
        self.assertEqual(resp.data["city"], "")
        self.assertEqual(resp.data["display_name"], "Ali")
        self.assertFalse(resp.data["indexable"])

    def test_report_endpoint(self):
        self.client.credentials()
        resp = self.client.post(
            "/api/v1/public/ustoz/report/", {"reason": "spam"}, format="json"
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(Report.objects.filter(profile=self.profile).count(), 1)


class WebhookTests(BaseAuth):
    def test_webhook_marks_verified(self):
        self.client.credentials()
        resp = self.client.post(
            "/api/v1/webhooks/ilmlan/",
            {"slug": "ustoz", "published_courses": 2},
            format="json",
            HTTP_X_WEBHOOK_SECRET="dev-secret",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.verified_teacher)

    def test_webhook_rejects_bad_secret(self):
        self.client.credentials()
        resp = self.client.post(
            "/api/v1/webhooks/ilmlan/",
            {"slug": "ustoz", "published_courses": 1},
            format="json",
            HTTP_X_WEBHOOK_SECRET="wrong",
        )
        self.assertEqual(resp.status_code, 403)


class AnalyticsExportTests(BaseAuth):
    def test_csv_export(self):
        resp = self.client.get("/api/v1/analytics/export.csv")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp["Content-Type"], "text/csv")
        self.assertIn(b"date,type,link", resp.content)
