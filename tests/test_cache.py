"""Analysis cache: memoise a term's records/derivations, bust on new votings.

The cache exists so the §4 API routes don't reload ~all of a term's votes and
recompute defection scores on every request (O(all votes), ~1.7s at full term).
It is keyed by a cheap data-version signal read from the votings table, so a new
ingest invalidates it automatically while repeated requests are served from
memory. These tests pin both halves: cache hits return the same object, and a
new voting busts it.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date

import pytest
from analysis import cache, metrics
from ingestion import repository
from ingestion.models import Term, Voting


def _term() -> Term:
    return Term(num=10, date_from=date(2023, 11, 13), date_to=None, current=True)


@pytest.fixture(autouse=True)
def _isolate_cache() -> Iterator[None]:
    cache.clear()
    yield
    cache.clear()


def test_vote_records_cached_until_data_changes(db_conn, load_fixture) -> None:
    repository.upsert_term(db_conn, _term())
    repository.upsert_voting(
        db_conn, Voting.from_api(load_fixture("voting_electronic.json"))
    )

    first = cache.vote_records(db_conn, 10)
    again = cache.vote_records(db_conn, 10)
    assert again is first  # cache hit: not reloaded from the DB

    # A newly ingested voting changes the data-version signal and busts the cache.
    repository.upsert_voting(
        db_conn, Voting.from_api(load_fixture("voting_quorum.json"))
    )
    after = cache.vote_records(db_conn, 10)
    assert after is not first
    assert len(after) > len(first)


def test_defection_scores_memoised_and_busted(db_conn, load_fixture) -> None:
    repository.upsert_term(db_conn, _term())
    repository.upsert_voting(
        db_conn, Voting.from_api(load_fixture("voting_electronic.json"))
    )

    scores = cache.defection_scores(db_conn, 10)
    assert cache.defection_scores(db_conn, 10) is scores  # memoised
    # And it is the real computed result, not a placeholder.
    assert scores == metrics.defection_scores(cache.vote_records(db_conn, 10))

    repository.upsert_voting(
        db_conn, Voting.from_api(load_fixture("voting_quorum.json"))
    )
    assert cache.defection_scores(db_conn, 10) is not scores  # recomputed


def test_pair_similarities_memoised(db_conn, load_fixture) -> None:
    repository.upsert_term(db_conn, _term())
    repository.upsert_voting(
        db_conn, Voting.from_api(load_fixture("voting_electronic.json"))
    )

    sims = cache.pair_similarities(db_conn, 10, min_shared=1)
    assert cache.pair_similarities(db_conn, 10, min_shared=1) is sims  # memoised
    # A different min_shared is a different computation, not the cached one.
    assert cache.pair_similarities(db_conn, 10, min_shared=5) is not sims
