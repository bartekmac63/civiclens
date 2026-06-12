"""Incremental-sync integration test: mocked HTTP + real Postgres.

Proves the gap-detection logic — first run fetches missing votings, a second
run fetches nothing — which is the heart of "incremental sync since the last
voting". Skipped automatically when no database is available.
"""

from __future__ import annotations

from datetime import date
from typing import Any

import httpx
import respx
from ingestion import repository
from ingestion.models import Term
from ingestion.sejm_client import BASE_URL, SejmClient
from ingestion.sync import incremental_sync_votings


def _summary(number: int) -> dict[str, Any]:
    return {
        "term": 10,
        "sitting": 1,
        "votingNumber": number,
        "date": "2023-11-13T15:00:00",
        "title": f"Voting {number}",
        "kind": "ELECTRONIC",
        "yes": 1,
        "no": 0,
        "abstain": 0,
        "notParticipating": 0,
        "totalVoted": 1,
    }


def _detail(number: int) -> dict[str, Any]:
    data = _summary(number)
    data["votes"] = [{"MP": 1, "club": "KO", "vote": "YES"}]
    return data


@respx.mock
def test_incremental_sync_fetches_gap_then_skips(db_conn) -> None:
    # The term must persist across the sync's internal commits (FK target).
    repository.upsert_term(db_conn, Term(10, date(2023, 11, 13), None, True))
    db_conn.commit()

    respx.get(f"{BASE_URL}/term10/votings").mock(
        return_value=httpx.Response(
            200, json=[{"date": "2023-11-13", "proceeding": 1, "votingsNum": 2}]
        )
    )
    respx.get(f"{BASE_URL}/term10/votings/1").mock(
        return_value=httpx.Response(200, json=[_summary(1), _summary(2)])
    )
    respx.get(f"{BASE_URL}/term10/votings/1/1").mock(
        return_value=httpx.Response(200, json=_detail(1))
    )
    respx.get(f"{BASE_URL}/term10/votings/1/2").mock(
        return_value=httpx.Response(200, json=_detail(2))
    )

    with SejmClient() as client:
        first = incremental_sync_votings(client, db_conn, 10)
        second = incremental_sync_votings(client, db_conn, 10)

    assert first == 2  # both votings were missing → fetched
    assert second == 0  # proceeding now complete → nothing re-fetched
    assert repository.count_votings(db_conn, 10) == 2
    assert repository.count_mp_votes(db_conn, 10) == 2


@respx.mock
def test_incremental_sync_respects_max_votings(db_conn) -> None:
    repository.upsert_term(db_conn, Term(10, date(2023, 11, 13), None, True))
    db_conn.commit()

    respx.get(f"{BASE_URL}/term10/votings").mock(
        return_value=httpx.Response(
            200, json=[{"date": "2023-11-13", "proceeding": 1, "votingsNum": 2}]
        )
    )
    respx.get(f"{BASE_URL}/term10/votings/1").mock(
        return_value=httpx.Response(200, json=[_summary(1), _summary(2)])
    )
    respx.get(f"{BASE_URL}/term10/votings/1/1").mock(
        return_value=httpx.Response(200, json=_detail(1))
    )
    respx.get(f"{BASE_URL}/term10/votings/1/2").mock(
        return_value=httpx.Response(200, json=_detail(2))
    )

    with SejmClient() as client:
        fetched = incremental_sync_votings(client, db_conn, 10, max_votings=1)

    assert fetched == 1
    assert repository.count_votings(db_conn, 10) == 1
