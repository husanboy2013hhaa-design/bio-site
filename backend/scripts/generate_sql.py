"""Render all Django migrations to PostgreSQL SQL — no live database required.

Usage:
    python backend/scripts/generate_sql.py
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.db import connection
from django.db.migrations.loader import MigrationLoader

# psycopg mogrify() needs a live cursor; DDL never uses params, so render offline.
from django.db.backends.postgresql.operations import DatabaseOperations

DatabaseOperations.compose_sql = lambda self, sql, params: str(sql)


def main():
    loader = MigrationLoader(None, replace_migrations=False)
    graph = loader.graph
    order, seen = [], set()
    for leaf in graph.leaf_nodes():
        for key in graph.forwards_plan(leaf):
            if key not in seen:
                seen.add(key)
                order.append(key)

    statements = []
    state = None
    for key in order:
        migration = graph.nodes[key]
        with connection.schema_editor(collect_sql=True, atomic=False) as editor:
            if state is None:
                state = loader.project_state(key, at_end=False)
            state = migration.apply(state, editor, collect_sql=True)
        if editor.collected_sql:
            statements.append(f"-- {migration.app_label}.{migration.name}")
            statements.extend(editor.collected_sql)
            statements.append("")

    header = [
        "-- LinkHub — PostgreSQL schema, generated from Django migrations.",
        "-- Regenerate: python backend/scripts/generate_sql.py",
        "",
        "BEGIN;",
        "",
    ]
    footer = ["COMMIT;"]
    out = Path(__file__).resolve().parent.parent.parent / "docs" / "database-schema.sql"
    out.write_text("\n".join(header + statements + footer) + "\n", encoding="utf-8")
    print(f"Written: {out} ({len(statements)} lines)")


if __name__ == "__main__":
    main()
