"""Read stored votes out of PostgreSQL into pure :class:`VoteRecord` rows.

Only ELECTRONIC votings carry a yes/no/abstain choice, so analysis reads those
by default. This is the only I/O in the analysis package; the maths
(:mod:`analysis.metrics`) stays pure and DB-free.
"""

from __future__ import annotations

import psycopg

from analysis.metrics import VoteRecord


def load_vote_records(
    conn: psycopg.Connection, term: int, *, electronic_only: bool = True
) -> list[VoteRecord]:
    sql = """
        SELECT mv.sitting, mv.voting_number, mv.mp_id, mv.club, mv.vote
        FROM mp_votes mv
        JOIN votings v
          ON v.term = mv.term
         AND v.sitting = mv.sitting
         AND v.voting_number = mv.voting_number
        WHERE mv.term = %s
    """
    if electronic_only:
        sql += " AND v.kind = 'ELECTRONIC'"

    rows = conn.execute(sql, (term,)).fetchall()
    return [
        VoteRecord(
            voting_id=(sitting, voting_number),
            mp_id=mp_id,
            club=club,
            vote=vote,
        )
        for (sitting, voting_number, mp_id, club, vote) in rows
    ]
