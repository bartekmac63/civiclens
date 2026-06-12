"""Database connection helpers.

The DSN comes from ``DATABASE_URL`` so the same code runs against the local dev
cluster, docker-compose, and CI. The default matches docker-compose.yml.
"""

from __future__ import annotations

import os

import psycopg

DEFAULT_DSN = "postgresql://civiclens:civiclens@localhost:5432/civiclens"


def get_dsn() -> str:
    return os.environ.get("DATABASE_URL", DEFAULT_DSN)


def connect(dsn: str | None = None) -> psycopg.Connection:
    """Open a new connection. Caller owns the connection lifecycle."""
    return psycopg.connect(dsn or get_dsn())
