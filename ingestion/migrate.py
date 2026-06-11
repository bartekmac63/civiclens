"""Forward-only SQL migrations.

Applies every ``*.sql`` file in ``migrations/`` that has not yet been recorded
in ``schema_migrations``, in filename order. Idempotent: re-running applies only
the new files.
"""

from __future__ import annotations

from pathlib import Path

import psycopg

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def apply_migrations(conn: psycopg.Connection) -> list[str]:
    """Apply pending migrations; return the list of versions newly applied."""
    with conn.cursor() as cur:
        cur.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            "  version text PRIMARY KEY,"
            "  applied_at timestamptz NOT NULL DEFAULT now()"
            ")"
        )
        cur.execute("SELECT version FROM schema_migrations")
        applied = {row[0] for row in cur.fetchall()}

    pending = sorted(
        path for path in MIGRATIONS_DIR.glob("*.sql") if path.name not in applied
    )

    newly_applied: list[str] = []
    for path in pending:
        with conn.cursor() as cur:
            cur.execute(path.read_text(encoding="utf-8"))
            cur.execute(
                "INSERT INTO schema_migrations (version) VALUES (%s)", (path.name,)
            )
        newly_applied.append(path.name)

    conn.commit()
    return newly_applied
