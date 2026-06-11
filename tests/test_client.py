"""Client tests — mock httpx with respx to assert URLs and model integration."""

from __future__ import annotations

import httpx
import respx
from ingestion.sejm_client import BASE_URL, SejmClient


@respx.mock
def test_get_terms_hits_term_endpoint(load_fixture) -> None:
    route = respx.get(f"{BASE_URL}/term").mock(
        return_value=httpx.Response(200, json=load_fixture("terms.json"))
    )
    with SejmClient() as client:
        terms = client.get_terms()
    assert route.called
    assert terms[-1].num == 10


@respx.mock
def test_get_mps_builds_term_scoped_url(load_fixture) -> None:
    respx.get(f"{BASE_URL}/term10/MP").mock(
        return_value=httpx.Response(200, json=load_fixture("mps.json"))
    )
    with SejmClient() as client:
        mps = client.get_mps(10)
    assert [m.id for m in mps] == [1, 2, 3]
    assert all(m.term == 10 for m in mps)


@respx.mock
def test_get_voting_parses_per_mp_votes(load_fixture) -> None:
    respx.get(f"{BASE_URL}/term10/votings/1/8").mock(
        return_value=httpx.Response(200, json=load_fixture("voting_electronic.json"))
    )
    with SejmClient() as client:
        voting = client.get_voting(10, 1, 8)
    assert voting.voting_number == 8
    assert len(voting.votes) == 15


@respx.mock
def test_http_error_propagates() -> None:
    respx.get(f"{BASE_URL}/term").mock(return_value=httpx.Response(500))
    raised = False
    try:
        with SejmClient() as client:
            client.get_terms()
    except httpx.HTTPStatusError:
        raised = True
    assert raised, "a 5xx must raise, never be swallowed or faked"
