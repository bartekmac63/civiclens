"""In-process, signal-invalidated cache for the analysis layer.

Loading a term's vote records and deriving defection scores or pairwise
co-voting similarities is O(all votes) — about 1.7s at a full term (~2M rows).
The §4 API routes call into this on every request, but the underlying data only
changes when ingestion adds votings. So we memoise per ``(dsn, term)``, keyed by
a cheap "data version" read from the small votings table: ``(voting count,
latest voted_at)``. Incremental sync only ever adds new votings (each written
atomically with its votes), so that signal changes exactly when the vote data
does — a new ingest busts the cache while every request in between is served
from memory.

The entry holds the loaded records plus its lazily-derived products, so all the
routes that need the same term share one load and one computation.
"""

from __future__ import annotations

from dataclasses import dataclass

import psycopg
from ingestion.db import connect

from analysis import metrics
from analysis.data import load_vote_records
from analysis.metrics import VoteRecord

# (voting count, latest voted_at as ISO text or ""). Cheap to read (~2ms) and it
# moves whenever ingestion adds a voting.
DataVersion = tuple[int, str]


@dataclass
class _Entry:
    version: DataVersion
    records: list[VoteRecord]
    scores: dict[int, float | None] | None = None
    # Cached similarities keep the min_shared they were computed with, so a query
    # with a different threshold recomputes rather than returning a wrong result.
    similarities: tuple[int, dict[tuple[int, int], float]] | None = None


_cache: dict[tuple[str, int], _Entry] = {}


def clear() -> None:
    """Drop all cached entries (used by tests; harmless in production)."""
    _cache.clear()


def data_version(conn: psycopg.Connection, term: int) -> DataVersion:
    """A cheap signal that changes whenever the term's vote data changes."""
    row = conn.execute(
        "SELECT count(*), coalesce(max(voted_at)::text, '') "
        "FROM votings WHERE term = %s",
        (term,),
    ).fetchone()
    return (int(row[0]), str(row[1])) if row else (0, "")


def _entry(conn: psycopg.Connection, term: int) -> _Entry:
    version = data_version(conn, term)
    key = (conn.info.dsn, term)
    entry = _cache.get(key)
    if entry is None or entry.version != version:
        entry = _Entry(version=version, records=load_vote_records(conn, term))
        _cache[key] = entry
    return entry


def vote_records(conn: psycopg.Connection, term: int) -> list[VoteRecord]:
    """The term's vote records, loaded once per data version."""
    return _entry(conn, term).records


def defection_scores(conn: psycopg.Connection, term: int) -> dict[int, float | None]:
    """Per-MP defection scores for the term, computed once per data version."""
    entry = _entry(conn, term)
    if entry.scores is None:
        entry.scores = metrics.defection_scores(entry.records)
    return entry.scores


def pair_similarities(
    conn: psycopg.Connection, term: int, *, min_shared: int
) -> dict[tuple[int, int], float]:
    """Pairwise co-voting similarities, computed once per (data version, min_shared)."""
    entry = _entry(conn, term)
    if entry.similarities is None or entry.similarities[0] != min_shared:
        entry.similarities = (
            min_shared,
            metrics.pair_similarities(entry.records, min_shared=min_shared),
        )
    return entry.similarities[1]


def warm(term: int = 10, *, dsn: str | None = None) -> int:
    """Pre-compute and cache a term's records, scores, and similarities.

    Opens its own connection so it can be called from a CLI after ingestion.
    Returns the number of vote records loaded.
    """
    conn = connect(dsn)
    try:
        records = vote_records(conn, term)
        defection_scores(conn, term)
        return len(records)
    finally:
        conn.close()
