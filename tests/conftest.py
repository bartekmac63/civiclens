"""Shared test fixtures: real Sejm payloads and a gated DB connection."""

from __future__ import annotations

import json
from collections.abc import Callable, Iterator
from pathlib import Path
from typing import Any

import psycopg
import pytest
from ingestion.db import connect
from ingestion.migrate import apply_migrations

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "sejm"


def _load(name: str) -> Any:
    return json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))


@pytest.fixture
def load_fixture() -> Callable[[str], Any]:
    return _load


@pytest.fixture
def db_conn() -> Iterator[psycopg.Connection]:
    """A migrated connection; each test's writes are rolled back.

    Skips automatically when no database is reachable, so the suite stays green
    without a local Postgres (CI provisions one in Phase 8).
    """
    try:
        conn = connect()
    except psycopg.OperationalError as exc:  # pragma: no cover - env dependent
        pytest.skip(f"no database available: {exc}")

    apply_migrations(conn)  # commits the schema
    try:
        yield conn
        conn.rollback()  # discard uncommitted writes
        # Some tests (the sync integration test) commit internally; truncate the
        # data tables so every DB test is isolated and the cluster is left clean.
        conn.execute(
            "TRUNCATE terms, mps, clubs, votings, mp_votes RESTART IDENTITY CASCADE"
        )
        conn.commit()
    finally:
        conn.close()
