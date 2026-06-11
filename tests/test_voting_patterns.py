"""DB-gated wiring test: stored votes -> reader -> metrics -> public API.

Inserts a small known dataset into the test database and checks the public,
DB-backed functions read and compute it correctly. The maths themselves are
exhaustively covered (offline) in test_metrics.py.
"""

from __future__ import annotations

from datetime import date, datetime

from analysis import voting_patterns
from ingestion import repository
from ingestion.models import MPVote, Term, Voting


def _electronic_voting(votes: list[MPVote]) -> Voting:
    return Voting(
        term=10,
        sitting=1,
        voting_number=1,
        voted_at=datetime(2023, 11, 13, 15, 0, 0),
        title="Test voting",
        topic=None,
        description=None,
        kind="ELECTRONIC",
        yes=sum(v.vote == "YES" for v in votes),
        no=sum(v.vote == "NO" for v in votes),
        abstain=0,
        not_participating=0,
        total_voted=len(votes),
        majority_type=None,
        majority_votes=None,
        sitting_day=1,
        votes=tuple(votes),
    )


def test_public_api_reads_and_computes_from_db(db_conn, test_dsn) -> None:
    # Club A: 7 YES (mp 1..7) + 1 NO (mp 8). mp 8 is the lone dissenter.
    votes = [MPVote(mp_id=mp, club="A", vote="YES") for mp in range(1, 8)]
    votes.append(MPVote(mp_id=8, club="A", vote="NO"))

    repository.upsert_term(db_conn, Term(10, date(2023, 11, 13), None, True))
    repository.upsert_voting(db_conn, _electronic_voting(votes))
    db_conn.commit()  # the public API opens its own connection

    cohesion = voting_patterns.club_cohesion(10, dsn=test_dsn)
    assert cohesion["A"] == 0.75  # |7-1|/8

    assert voting_patterns.rebel_score(8, 10, dsn=test_dsn) == 1.0
    assert voting_patterns.rebel_score(1, 10, dsn=test_dsn) == 0.0
    # An MP who never voted this term is insufficient -> None, not 0.
    assert voting_patterns.rebel_score(9999, 10, dsn=test_dsn) is None
