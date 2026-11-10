"""Read-only probe: what already exists in the remote database?"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import psycopg

url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
conn = psycopg.connect(url, connect_timeout=20, sslmode="require")
cur = conn.cursor()

cur.execute("SELECT current_database(), version()")
db, ver = cur.fetchone()
print("DB:", db)
print("PG:", ver.split(",")[0])

cur.execute(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1"
)
tables = [r[0] for r in cur.fetchall()]
print(f"\nTABLES ({len(tables)}):")
print(", ".join(tables))

product = [
    "accounts_user",
    "profiles_profile",
    "profiles_theme",
    "links_link",
    "links_clickevent",
    "analytics_dailystat",
]
print("\nPRODUCT TABLES:")
for t in product:
    print(f"  {'YES' if t in tables else 'no ':3} {t}")

try:
    cur.execute("SELECT count(*) FROM django_migrations")
    print("\ndjango_migrations rows:", cur.fetchone()[0])
    cur.execute("SELECT app, name FROM django_migrations ORDER BY id DESC LIMIT 5")
    for app, name in cur.fetchall():
        print(f"  last: {app}.{name}")
except Exception as e:
    print("\ndjango_migrations:", getattr(e, "pgerror", None) or e)

conn.close()
