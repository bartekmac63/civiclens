"""Forward-only SQL migrations.

Applies every ``*.sql`` file in ``migrations/`` that has not yet been recorded
in ``schema_migrations``, in filename order. Idempotent: re-running applies only
the new files.

Run as a module to migrate the database named by ``DATABASE_URL`` (used by the
docker-compose ``api`` service before it starts serving)::

    python -m ingestion.migrate
"""

from __future__ import annotations

import sys
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


def main() -> int:
    """Apply pending migrations to the ``DATABASE_URL`` database; print a summary."""
    from ingestion.db import connect

    conn = connect()
    try:
        applied = apply_migrations(conn)
    finally:
        conn.close()
    print(
        f"[civiclens] {len(applied)} migration(s) applied: {applied}"
        if applied
        else "[civiclens] schema already up to date"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
