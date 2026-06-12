"""API route tests against a seeded test database (skipped if none available)."""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date, datetime

import psycopg
import pytest
from api.dependencies import get_conn
from api.main import app
from fastapi.testclient import TestClient
from ingestion import repository
from ingestion.models import MP, MPVote, Term, Voting


def _voting(number: int, votes: list[MPVote], topic: str) -> Voting:
    return Voting(
        term=10,
        sitting=1,
        voting_number=number,
        voted_at=datetime(2023, 11, 13, 15, number, 0),
        title=f"Voting {number}",
        topic=topic,
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


def _seed(conn: psycopg.Connection) -> None:
    repository.upsert_term(conn, Term(10, date(2023, 11, 13), None, True))
    repository.upsert_mps(
        conn,
        [
            MP(
                term=10,
                id=1,
                first_name="Andrzej",
                last_name="Adamczyk",
                second_name="Mieczysław",
                club="PiS",
                district_name="Kraków",
                district_num=13,
                voivodeship="małopolskie",
                active=True,
                birth_date=date(1959, 1, 4),
                profession="ekonomista",
            )
        ],
    )
    # v1 majority YES (mp1 conforms); v2 majority YES (mp1 defects) -> mp1 = 0.5
    repository.upsert_voting(
        conn,
        _voting(
            1,
            [MPVote(1, "PiS", "YES"), MPVote(2, "PiS", "YES"), MPVote(3, "PiS", "NO")],
            "Topic A",
        ),
    )
    repository.upsert_voting(
        conn,
        _voting(
            2,
            [MPVote(1, "PiS", "NO"), MPVote(2, "PiS", "YES"), MPVote(3, "PiS", "YES")],
            "Topic A",
        ),
    )


@pytest.fixture
def client(db_conn: psycopg.Connection, test_dsn: str) -> Iterator[TestClient]:
    _seed(db_conn)
    db_conn.commit()

    def override() -> Iterator[psycopg.Connection]:
        conn = psycopg.connect(test_dsn)
        try:
            yield conn
        finally:
            conn.close()

    app.dependency_overrides[get_conn] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_list_mps_includes_defection_score(client: TestClient) -> None:
    resp = client.get("/mps?term=10")
    assert resp.status_code == 200
    mps = resp.json()
    assert len(mps) == 1
    assert mps[0]["lastName"] == "Adamczyk"
    assert mps[0]["defectionScore"] == 0.5


def test_get_mp_detail(client: TestClient) -> None:
    resp = client.get("/mps/1?term=10")
    assert resp.status_code == 200
    body = resp.json()
    assert body["club"] == "PiS"
    assert body["birthDate"] == "1959-01-04"
    assert body["active"] is True


def test_get_unknown_mp_is_404(client: TestClient) -> None:
    assert client.get("/mps/9999?term=10").status_code == 404


def test_get_mp_votes(client: TestClient) -> None:
    resp = client.get("/mps/1/votes?term=10")
    assert resp.status_code == 200
    votes = resp.json()
    assert [v["vote"] for v in votes] == ["YES", "NO"]
    # v1: with the YES majority -> False; v2: NO against YES majority -> True.
    assert [v["defected"] for v in votes] == [False, True]


def test_defection_score_endpoint_carries_provenance(client: TestClient) -> None:
    resp = client.get("/mps/1/defection-score?term=10")
    assert resp.status_code == 200
    body = resp.json()
    assert body["score"] == 0.5
    assert body["provenance"]["term"] == 10
    assert body["provenance"]["electronicVotingsInStore"] == 2
    assert body["provenance"]["source"] == "https://api.sejm.gov.pl"


def test_topics_aggregates_real_votings(client: TestClient) -> None:
    resp = client.get("/topics?term=10")
    assert resp.status_code == 200
    topics = resp.json()
    assert {"topic": "Topic A", "votingCount": 2} in topics


def test_planned_routes_report_501(client: TestClient) -> None:
    assert client.get("/bills").status_code == 501
    assert client.get("/bills/1").status_code == 501


def test_blocs_returns_nodes_edges_and_provenance(client: TestClient) -> None:
    # Seed (see _seed): mps 1-3 share 2 ELECTRONIC votings.
    # Agreements — (2,3): v1 YES/NO disagree? v1: mp2 YES, mp3 NO -> disagree;
    # v2: mp2 YES, mp3 YES -> agree => 1/2. (1,2): v1 agree, v2 disagree => 1/2.
    # (1,3): v1 disagree (YES vs NO), v2 disagree (NO vs YES) => 0/2.
    resp = client.get("/blocs?term=10&minSimilarity=0.5&maxNodes=10")
    assert resp.status_code == 200
    body = resp.json()

    # Only MP 1 exists in the mps table; nodes come from there.
    assert [n["id"] for n in body["nodes"]] == [1]
    assert body["nodes"][0]["defectionScore"] == 0.5

    # All pairs are below min_shared (2 < 10) -> no edges, honestly.
    assert body["edges"] == []
    prov = body["provenance"]
    assert prov["minSharedVotes"] == 10
    assert prov["electronicVotingsInStore"] == 2
    assert prov["edgeFloor"] == 0.5


def test_blocs_edges_appear_once_min_shared_is_met(
    client: TestClient, db_conn: psycopg.Connection
) -> None:
    # Make MPs 2 and 3 real nodes, then add 10 votings: 1+2 agree YES, 3 votes NO.
    repository.upsert_mps(
        db_conn,
        [
            MP(
                10,
                2,
                "Piotr",
                "Adamowicz",
                None,
                "PiS",
                None,
                None,
                None,
                True,
                None,
                None,
            ),
            MP(
                10, 3, "Adam", "Trzeci", None, "PiS", None, None, None, True, None, None
            ),
        ],
    )
    for n in range(11, 21):
        repository.upsert_voting(
            db_conn,
            _voting(
                n,
                [
                    MPVote(1, "PiS", "YES"),
                    MPVote(2, "PiS", "YES"),
                    MPVote(3, "PiS", "NO"),
                ],
                "Topic B",
            ),
        )
    db_conn.commit()

    body = client.get("/blocs?term=10&minSimilarity=0.5&maxNodes=10").json()

    # Hand-computed over the 12 shared votings:
    # (1,2): agree on v1 + v11..20, disagree v2 -> 11/12 = 0.9167
    # (1,3) 0/12 and (2,3) 1/12 -> below the 0.5 floor, excluded.
    assert [(e["a"], e["b"], e["similarity"]) for e in body["edges"]] == [
        (1, 2, 0.9167)
    ]
    # Nodes ranked by defection score: mp3 defects 11/12, mp1 1/12, mp2 0/12.
    assert [n["id"] for n in body["nodes"]] == [3, 1, 2]


def test_openapi_renders_with_the_section4_paths(client: TestClient) -> None:
    spec = client.get("/openapi.json").json()
    for path in (
        "/mps",
        "/mps/{mp_id}",
        "/mps/{mp_id}/votes",
        "/mps/{mp_id}/defection-score",
        "/bills",
        "/bills/{bill_id}",
        "/blocs",
        "/topics",
    ):
        assert path in spec["paths"], f"missing {path}"
