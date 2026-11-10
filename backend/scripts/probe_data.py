"""Read-only: row counts in product tables."""
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
import psycopg

conn = psycopg.connect(os.getenv("DIRECT_URL"), connect_timeout=20, sslmode="require")
cur = conn.cursor()
for t in ["accounts_user", "profiles_profile", "profiles_theme", "links_link", "links_clickevent", "analytics_dailystat"]:
    cur.execute(f"SELECT count(*) FROM {t}")
    print(f"{t:24} {cur.fetchone()[0]}")
conn.close()
