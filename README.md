# LinkHub — Linktree-style SaaS (full-stack)

Sellable link-in-bio platform: public profile pages, link management, themes and analytics.

- **Backend:** Python 3.12+, Django 6, Django REST Framework, JWT (SimpleJWT), PostgreSQL
- **Frontend:** Next.js 15 (App Router), React 19, plain CSS
- **Docs:** OpenAPI/Swagger at `/api/docs/`, database schema in [`docs/database-schema.sql`](docs/database-schema.sql)

## Features

- Email + password auth (JWT, refresh rotation, logout blacklist, password reset)
- Public profile pages at `/<username>` (no login required to view)
- Link CRUD with drag order (up/down reorder API), activate/deactivate, click counter
- Theme editor: background, text, button colors, button shape, live preview
- Analytics: total clicks, profile views, top links, 30-day daily rollup table
- GDPR-aware click tracking (salted IP hash, no raw IPs)
- Rate limiting, ownership checks on every mutation, reserved-handle protection
- Django admin, Swagger UI, Docker Compose, test suite

## Repository layout

```
backend/            Django project (config/ + apps/)
  apps/accounts     Custom User, auth endpoints
  apps/profiles     Profile, Theme, public profile API
  apps/links        Link, ClickEvent, reorder, click tracking
  apps/analytics    DailyStat rollups, overview endpoint
  scripts/          generate_sql.py (offline SQL export)
frontend/           Next.js app (login, register, dashboard, /[username])
docs/               database-schema.sql, API.md
docker-compose.yml  Postgres + backend + frontend
```

## Quickstart (local, no Docker)

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # then edit DB credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

Zero-dependency test run (SQLite, no Postgres needed):

```bash
DB_ENGINE=sqlite python manage.py test tests
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                                          # http://localhost:3000
```

### 3. Docker (all-in-one)

```bash
docker compose up --build
# backend  → http://localhost:8000/api/v1/
# api docs → http://localhost:8000/api/docs/
# frontend → http://localhost:3000
```

## Database

Authoritative PostgreSQL DDL: [`docs/database-schema.sql`](docs/database-schema.sql)
(generated from migrations — regenerate with `python backend/scripts/generate_sql.py`).

Core tables: `accounts_user`, `profiles_profile`, `profiles_theme`,
`links_link`, `links_clickevent`, `analytics_dailystat`.

Nightly rollup job (cron):

```bash
python manage.py rollup_daily_stats --days=7
```

## API overview

| Method | Endpoint | Auth |
| --- | --- | --- |
| POST | `/api/v1/auth/register/` | no |
| POST | `/api/v1/auth/login/` | no |
| POST | `/api/v1/auth/logout/` | yes |
| POST | `/api/v1/auth/token/refresh/` | no |
| POST | `/api/v1/auth/password/reset/` | no |
| GET/PATCH | `/api/v1/profile/me/` | yes |
| GET/PATCH | `/api/v1/theme/` | yes |
| GET/POST | `/api/v1/links/` | yes |
| PATCH/DELETE | `/api/v1/links/<id>/` | yes |
| PATCH | `/api/v1/links/reorder/` | yes |
| POST | `/api/v1/links/<id>/click/` | no |
| GET | `/api/v1/public/<username>/` | no |
| GET | `/api/v1/analytics/overview/` | yes |

Full interactive docs: `http://localhost:8000/api/docs/` (Swagger UI).

## Production checklist

- [ ] `DJANGO_DEBUG=False`, strong `DJANGO_SECRET_KEY`, real `DJANGO_ALLOWED_HOSTS`
- [ ] HTTPS + `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` set to your domain
- [ ] Set a unique `CLICK_HASH_SALT` environment variable
- [ ] Serve media (avatars) from S3 or similar; run `collectstatic`
- [ ] Run `rollup_daily_stats` nightly via cron
- [ ] Add `frontend` and `backend` Dockerfiles to your registry; use managed Postgres

## License

MIT — see [LICENSE](LICENSE). You may rebrand and sell this as your own product.
