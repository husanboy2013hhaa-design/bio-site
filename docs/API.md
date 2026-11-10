# LinkHub API

Base URL: `http://localhost:8000/api/v1`
Interactive Swagger UI: `/api/docs/` · Schema: `/api/schema/`

All authenticated endpoints expect: `Authorization: Bearer <access>`

## Auth

### POST /auth/register/
```json
{ "email": "ali@example.com", "username": "ali", "password": "S3cure-pass!" }
```
→ `201 { "user": {...}, "access": "...", "refresh": "..." }`
Creates User + Profile + Theme atomically. Username doubles as the public handle seed.

### POST /auth/login/
```json
{ "email": "ali@example.com", "password": "S3cure-pass!" }
```
→ `200 { "access": "...", "refresh": "..." }`

### POST /auth/logout/
Body: `{ "refresh": "..." }` → `204`. Blacklists the refresh token.

### POST /auth/token/refresh/
Body: `{ "refresh": "..." }` → `200 { "access": "..." }` (rotates refresh).

### POST /auth/password/reset/
Body: `{ "email": "..." }` → always `200` (no account enumeration).
Emails a link to `<FRONTEND_URL>/reset-password?uid=..&token=..`.

### POST /auth/password/reset/confirm/
Body: `{ "uid": "..", "token": "..", "password": "new-pass" }` → `200`.

## Profile

### GET/PATCH /profile/me/
```json
{
  "slug": "ali",
  "display_name": "Ali",
  "bio": "Creator",
  "avatar": null,
  "is_public": true,
  "url": "http://localhost:3000/ali",
  "theme": { "background": "#0f172a", "...": "..." }
}
```
PATCH accepts any subset. `slug` must be unique and not reserved
(admin, api, dashboard, login, register, static, media).

### GET/PATCH /theme/
Fields: `background`, `text_color`, `button_color`, `button_text_color`
(hex `#fff` / `#1a2b3c`), `button_style` (`square|rounded|pill`),
`font` (`Inter|system|serif|mono`), `background_image` (file).

### GET /public/<slug>/
No auth. `404` if profile missing or private. Increments `views_total`.
Returns `{ slug, display_name, bio, avatar, links: [...], theme }`
(links filtered to `is_active=true`, ordered by `position`).

## Links

### GET /links/ · POST /links/
POST body: `{ "title": "YouTube", "url": "https://…", "description": "", "icon": "" }`
→ `201`. URL must be http/https. New links get `position = last + 1`.

### PATCH /links/<id>/ · DELETE /links/<id>/
PATCH: partial update (title, url, description, icon, is_active, position).
DELETE → `204`. `404` if the link is not owned by the caller.

### PATCH /links/reorder/
Body: `{ "ids": [3, 1, 2] }` — must contain exactly the caller's link ids.
Two-phase update avoids unique-position collisions. Returns the new list.

### POST /links/<id>/click/
No auth, throttled (`click`). Records a `ClickEvent` (referrer, user agent,
salted IP hash — never raw IPs) and increments `links.clicks` +
`profiles.clicks_total` atomically. `404` for inactive/private links.

## Analytics

### GET /analytics/overview/
```json
{
  "total_clicks": 128,
  "total_links": 5,
  "profile_views": 940,
  "daily": [{ "date": "2026-10-01", "clicks": 12, "views": 0 }],
  "top_links": [{ "id": 3, "title": "YouTube", "url": "…", "clicks": 40 }]
}
```
`daily` comes from the `analytics_dailystat` rollup table
(populate with `python manage.py rollup_daily_stats`).

## Errors

Validation errors use DRF's standard shape:

```json
{ "url": ["URL must start with http:// or https:// and include a host."] }
```

`401` on missing/invalid tokens; throttling returns `429`.
