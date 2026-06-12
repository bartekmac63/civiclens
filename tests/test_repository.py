"""Repository tests against a real Postgres (skipped if none available)."""

from __future__ import annotations

from datetime import date

from ingestion import repository
from ingestion.models import MP, Club, Term, Voting


def _term() -> Term:
    return Term(num=10, date_from=date(2023, 11, 13), date_to=None, current=True)


def test_upsert_voting_is_idempotent(db_conn, load_fixture) -> None:
    repository.upsert_term(db_conn, _term())
    voting = Voting.from_api(load_fixture("voting_electronic.json"))

    repository.upsert_voting(db_conn, voting)
    repository.upsert_voting(db_conn, voting)  # re-running must not duplicate

    assert repository.count_votings(db_conn, 10) == 1
    assert repository.count_mp_votes(db_conn, 10) == len(voting.votes)
    assert repository.stored_voting_numbers(db_conn, 10, 1) == {8}


def test_upsert_quorum_voting_stores_present_votes(db_conn, load_fixture) -> None:
    repository.upsert_term(db_conn, _term())
    voting = Voting.from_api(load_fixture("voting_quorum.json"))

    repository.upsert_voting(db_conn, voting)

    assert repository.count_mp_votes(db_conn, 10) == len(voting.votes)
    row = db_conn.execute(
        "SELECT count(*) FROM mp_votes WHERE term = 10 AND vote = 'PRESENT'"
    ).fetchone()
    assert row is not None and row[0] == 4


def test_upsert_mps_and_clubs(db_conn, load_fixture) -> None:
    repository.upsert_term(db_conn, _term())
    mps = [MP.from_api(m, term=10) for m in load_fixture("mps.json")]
    clubs = [Club.from_api(c, term=10) for c in load_fixture("clubs.json")]

    assert repository.upsert_mps(db_conn, mps) == 3
    assert repository.upsert_clubs(db_conn, clubs) == 2
    # Upserting again updates in place, never duplicates.
    repository.upsert_mps(db_conn, mps)
    row = db_conn.execute("SELECT count(*) FROM mps WHERE term = 10").fetchone()
    assert row is not None and row[0] == 3
