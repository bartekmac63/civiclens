"""Ingestion orchestration: reference data + incremental voting sync.

A full ingest is just an incremental sync against an empty database. Re-running
fetches only the gap (idempotent upserts, per-proceeding stored-count check).

The API is the only source of truth. Any network/HTTP failure propagates and
aborts the run with a non-zero exit — we never fabricate parliamentary data.
"""

from __future__ import annotations

import argparse
import sys
import time
from collections import defaultdict
from dataclasses import dataclass

import psycopg

from ingestion import repository
from ingestion.db import connect
from ingestion.migrate import apply_migrations
from ingestion.sejm_client import SejmClient


@dataclass
class SyncSummary:
    term: int
    mps: int
    clubs: int
    votings_fetched: int
    total_votings: int
    total_mp_votes: int


def sync_reference(
    client: SejmClient, conn: psycopg.Connection, term: int
) -> tuple[int, int]:
    """Upsert terms, MPs, and clubs. Returns (mp_count, club_count)."""
    for t in client.get_terms():
        repository.upsert_term(conn, t)
    conn.commit()

    mp_count = repository.upsert_mps(conn, client.get_mps(term))
    club_count = repository.upsert_clubs(conn, client.get_clubs(term))
    conn.commit()
    return mp_count, club_count


def incremental_sync_votings(
    client: SejmClient,
    conn: psycopg.Connection,
    term: int,
    *,
    max_votings: int | None = None,
    delay: float = 0.0,
) -> int:
    """Fetch and upsert votings missing from the DB. Returns the count fetched."""
    expected: dict[int, int] = defaultdict(int)
    for day in client.get_proceedings(term):
        expected[day.proceeding] += day.votings_num

    fetched = 0
    for proceeding in sorted(expected):
        stored = repository.stored_voting_numbers(conn, term, proceeding)
        if len(stored) >= expected[proceeding]:
            continue  # proceeding fully ingested — skip

        summaries = client.get_sitting_votings(term, proceeding)
        missing = [s.voting_number for s in summaries if s.voting_number not in stored]
        for number in missing:
            voting = client.get_voting(term, proceeding, number)
            repository.upsert_voting(conn, voting)
            fetched += 1
            if delay:
                time.sleep(delay)
            if max_votings is not None and fetched >= max_votings:
                conn.commit()
                return fetched
        conn.commit()
    return fetched


def run(
    term: int = 10,
    *,
    max_votings: int | None = None,
    reference_only: bool = False,
    delay: float = 0.0,
    dsn: str | None = None,
) -> SyncSummary:
    conn = connect(dsn)
    try:
        apply_migrations(conn)
        with SejmClient() as client:
            mps, clubs = sync_reference(client, conn, term)
            fetched = (
                0
                if reference_only
                else incremental_sync_votings(
                    client, conn, term, max_votings=max_votings, delay=delay
                )
            )
        return SyncSummary(
            term=term,
            mps=mps,
            clubs=clubs,
            votings_fetched=fetched,
            total_votings=repository.count_votings(conn, term),
            total_mp_votes=repository.count_mp_votes(conn, term),
        )
    finally:
        conn.close()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Ingest Sejm data into PostgreSQL.")
    parser.add_argument("--term", type=int, default=10)
    parser.add_argument(
        "--max-votings",
        type=int,
        default=None,
        help="Cap voting details fetched this run (bounded real run).",
    )
    parser.add_argument("--reference-only", action="store_true")
    parser.add_argument(
        "--delay",
        type=float,
        default=0.0,
        help="Seconds to pause between voting-detail requests (be polite).",
    )
    args = parser.parse_args(argv)

    summary = run(
        term=args.term,
        max_votings=args.max_votings,
        reference_only=args.reference_only,
        delay=args.delay,
    )
    print(
        f"[civiclens] term {summary.term}: "
        f"{summary.mps} MPs, {summary.clubs} clubs, "
        f"{summary.votings_fetched} votings fetched this run "
        f"({summary.total_votings} votings / {summary.total_mp_votes} MP votes total)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
