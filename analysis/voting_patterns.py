"""Voting-pattern analysis over stored Sejm voting data.

Public, DB-backed API: club cohesion and per-MP defection (rebel) scores,
computed from the real MP–vote records in PostgreSQL. The maths live in
:mod:`analysis.metrics`; this module just reads the data and applies them.

Every result is derived from real stored votes. Where the data is insufficient
(an MP who never cast a countable vote, a club with no yes/no votes) the value
is ``None`` — never a fabricated zero.
"""

from __future__ import annotations

import psycopg
from ingestion.db import connect

from analysis import metrics
from analysis.data import load_vote_records


def _read(term: int, dsn: str | None) -> list[metrics.VoteRecord]:
    conn: psycopg.Connection = connect(dsn)
    try:
        return load_vote_records(conn, term)
    finally:
        conn.close()


def club_cohesion(term: int = 10, *, dsn: str | None = None) -> dict[str, float | None]:
    """Return the mean Rice cohesion index per club for the given term."""
    return metrics.club_cohesion(_read(term, dsn))


def defection_scores(
    term: int = 10, *, dsn: str | None = None
) -> dict[int, float | None]:
    """Return the defection score for every MP who voted in the given term."""
    return metrics.defection_scores(_read(term, dsn))


def rebel_score(mp_id: int, term: int = 10, *, dsn: str | None = None) -> float | None:
    """Return how often an MP votes against their own club's majority (or None)."""
    return defection_scores(term, dsn=dsn).get(mp_id)
