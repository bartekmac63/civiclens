"""FastAPI dependencies — a per-request database connection."""

from __future__ import annotations

from collections.abc import Iterator

import psycopg
from ingestion.db import connect


def get_conn() -> Iterator[psycopg.Connection]:
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()
