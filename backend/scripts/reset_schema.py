"""Reset the public schema (approved by user — tables were empty)."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import psycopg

conn = psycopg.connect(os.getenv("DIRECT_URL"), connect_timeout=20, sslmode="require")
conn.autocommit = True
cur = conn.cursor()
cur.execute("DROP SCHEMA public CASCADE")
cur.execute("CREATE SCHEMA public")
cur.execute("GRANT ALL ON SCHEMA public TO postgres")
cur.execute("GRANT ALL ON SCHEMA public TO public")
cur.execute(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1"
)
print("remaining tables:", cur.fetchall() or "none — schema is clean")
conn.close()
