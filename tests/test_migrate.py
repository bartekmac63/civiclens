"""The `python -m ingestion.migrate` entrypoint (used by the compose api service)."""

from __future__ import annotations

from ingestion import migrate


def test_main_migrates_database_url_and_is_idempotent(
    db_conn, test_dsn, monkeypatch
) -> None:
    # main() connects via DATABASE_URL; point it at the test database.
    monkeypatch.setenv("DATABASE_URL", test_dsn)

    assert migrate.main() == 0  # applies (or finds already-applied) migrations
    assert migrate.main() == 0  # re-running is safe

    # The schema the API depends on exists afterwards.
    row = db_conn.execute(
        "SELECT count(*) FROM information_schema.tables "
        "WHERE table_name IN ('mps', 'votings', 'mp_votes')"
    ).fetchone()
    assert row is not None and row[0] == 3
