"""Idempotent persistence for Sejm models.

All writes are upserts (``ON CONFLICT ... DO UPDATE``) so re-running a sync is
safe and re-entrant. Transaction boundaries are owned by the caller
(:mod:`ingestion.sync`); nothing here commits.
"""

from __future__ import annotations

import psycopg

from ingestion.models import MP, Club, Term, Voting


def upsert_term(conn: psycopg.Connection, term: Term) -> None:
    conn.execute(
        """
        INSERT INTO terms (num, date_from, date_to, current, fetched_at)
        VALUES (%s, %s, %s, %s, now())
        ON CONFLICT (num) DO UPDATE SET
            date_from = EXCLUDED.date_from,
            date_to   = EXCLUDED.date_to,
            current   = EXCLUDED.current,
            fetched_at = now()
        """,
        (term.num, term.date_from, term.date_to, term.current),
    )


def upsert_mps(conn: psycopg.Connection, mps: list[MP]) -> int:
    if not mps:
        return 0
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO mps (
                term, id, first_name, last_name, second_name, club,
                district_name, district_num, voivodeship, active,
                birth_date, profession, fetched_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (term, id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                second_name = EXCLUDED.second_name,
                club = EXCLUDED.club,
                district_name = EXCLUDED.district_name,
                district_num = EXCLUDED.district_num,
                voivodeship = EXCLUDED.voivodeship,
                active = EXCLUDED.active,
                birth_date = EXCLUDED.birth_date,
                profession = EXCLUDED.profession,
                fetched_at = now()
            """,
            [
                (
                    m.term,
                    m.id,
                    m.first_name,
                    m.last_name,
                    m.second_name,
                    m.club,
                    m.district_name,
                    m.district_num,
                    m.voivodeship,
                    m.active,
                    m.birth_date,
                    m.profession,
                )
                for m in mps
            ],
        )
    return len(mps)


def upsert_clubs(conn: psycopg.Connection, clubs: list[Club]) -> int:
    if not clubs:
        return 0
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO clubs (term, id, name, members_count, fetched_at)
            VALUES (%s, %s, %s, %s, now())
            ON CONFLICT (term, id) DO UPDATE SET
                name = EXCLUDED.name,
                members_count = EXCLUDED.members_count,
                fetched_at = now()
            """,
            [(c.term, c.id, c.name, c.members_count) for c in clubs],
        )
    return len(clubs)


def upsert_voting(conn: psycopg.Connection, voting: Voting) -> None:
    """Upsert a voting and its per-MP votes."""
    conn.execute(
        """
        INSERT INTO votings (
            term, sitting, voting_number, voted_at, title, topic, description,
            kind, yes, no, abstain, not_participating, total_voted,
            majority_type, majority_votes, sitting_day, fetched_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
        ON CONFLICT (term, sitting, voting_number) DO UPDATE SET
            voted_at = EXCLUDED.voted_at,
            title = EXCLUDED.title,
            topic = EXCLUDED.topic,
            description = EXCLUDED.description,
            kind = EXCLUDED.kind,
            yes = EXCLUDED.yes,
            no = EXCLUDED.no,
            abstain = EXCLUDED.abstain,
            not_participating = EXCLUDED.not_participating,
            total_voted = EXCLUDED.total_voted,
            majority_type = EXCLUDED.majority_type,
            majority_votes = EXCLUDED.majority_votes,
            sitting_day = EXCLUDED.sitting_day,
            fetched_at = now()
        """,
        (
            voting.term,
            voting.sitting,
            voting.voting_number,
            voting.voted_at,
            voting.title,
            voting.topic,
            voting.description,
            voting.kind,
            voting.yes,
            voting.no,
            voting.abstain,
            voting.not_participating,
            voting.total_voted,
            voting.majority_type,
            voting.majority_votes,
            voting.sitting_day,
        ),
    )
    if voting.votes:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO mp_votes (
                    term, sitting, voting_number, mp_id, club, vote
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (term, sitting, voting_number, mp_id) DO UPDATE SET
                    club = EXCLUDED.club,
                    vote = EXCLUDED.vote
                """,
                [
                    (
                        voting.term,
                        voting.sitting,
                        voting.voting_number,
                        v.mp_id,
                        v.club,
                        v.vote,
                    )
                    for v in voting.votes
                ],
            )


def stored_voting_numbers(
    conn: psycopg.Connection, term: int, sitting: int
) -> set[int]:
    rows = conn.execute(
        "SELECT voting_number FROM votings WHERE term = %s AND sitting = %s",
        (term, sitting),
    ).fetchall()
    return {row[0] for row in rows}


def count_votings(conn: psycopg.Connection, term: int) -> int:
    row = conn.execute(
        "SELECT count(*) FROM votings WHERE term = %s", (term,)
    ).fetchone()
    return int(row[0]) if row else 0


def count_mp_votes(conn: psycopg.Connection, term: int) -> int:
    row = conn.execute(
        "SELECT count(*) FROM mp_votes WHERE term = %s", (term,)
    ).fetchone()
    return int(row[0]) if row else 0
