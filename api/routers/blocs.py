"""Co-voting bloc data for the §3.3 BlocGraph.

Nodes are the top MPs by defection score (spec: "showing top 200 by defection
score"); edges are pairwise co-voting similarities from real stored votes.
Pairs with too little shared participation are excluded by the analysis layer,
never given an invented number. The response carries provenance (data extent,
floor, cap) so the UI can say exactly what the graph is based on.

The pair computation is O(votings x voters^2) (~0.9s on the current store), so
results are cached in-process keyed by (dsn, term, stored vote count) — the
count changes whenever ingestion adds votes, which invalidates naturally.
"""

from __future__ import annotations

from datetime import UTC, datetime

import psycopg
from analysis.data import load_vote_records
from analysis.metrics import defection_scores, pair_similarities
from fastapi import APIRouter, Depends, Query

from api.dependencies import get_conn
from api.schemas import APIBlocEdge, APIBlocNode, APIBlocs, APIBlocsProvenance

router = APIRouter(tags=["blocs"])

MIN_SHARED_VOTES = 10
EDGE_FLOOR = 0.5
EDGE_CAP = 2000

# (dsn, term, mp_vote_count) -> (similarities, defection scores)
_cache: dict[
    tuple[str, int, int],
    tuple[dict[tuple[int, int], float], dict[int, float | None]],
] = {}


def _similarity_data(
    conn: psycopg.Connection, term: int
) -> tuple[dict[tuple[int, int], float], dict[int, float | None]]:
    row = conn.execute(
        "SELECT count(*) FROM mp_votes WHERE term = %s", (term,)
    ).fetchone()
    key = (conn.info.dsn, term, int(row[0]) if row else 0)
    if key not in _cache:
        records = load_vote_records(conn, term)
        _cache.clear()  # keep at most one entry — this is a small process cache
        _cache[key] = (
            pair_similarities(records, min_shared=MIN_SHARED_VOTES),
            defection_scores(records),
        )
    return _cache[key]


@router.get("/blocs", response_model=APIBlocs)
def get_blocs(
    term: int = 10,
    minSimilarity: float = Query(default=EDGE_FLOOR, ge=0.0, le=1.0),
    maxNodes: int = Query(default=200, ge=2, le=460),
    conn: psycopg.Connection = Depends(get_conn),
) -> APIBlocs:
    similarities, scores = _similarity_data(conn, term)

    rows = conn.execute(
        "SELECT id, first_name, last_name, club FROM mps WHERE term = %s",
        (term,),
    ).fetchall()

    # Top maxNodes by defection score; MPs without a score rank last (§3.3).
    rows.sort(key=lambda r: (scores.get(r[0]) is None, -(scores.get(r[0]) or 0.0)))
    selected = rows[:maxNodes]
    selected_ids = {r[0] for r in selected}

    floor = max(minSimilarity, EDGE_FLOOR)
    edges = [
        APIBlocEdge(a=a, b=b, similarity=round(s, 4))
        for (a, b), s in similarities.items()
        if s >= floor and a in selected_ids and b in selected_ids
    ]
    edges.sort(key=lambda e: -e.similarity)
    edges = edges[:EDGE_CAP]

    electronic = conn.execute(
        "SELECT count(*) FROM votings WHERE term = %s AND kind = 'ELECTRONIC'",
        (term,),
    ).fetchone()

    return APIBlocs(
        nodes=[
            APIBlocNode(
                id=r[0],
                firstName=r[1],
                lastName=r[2],
                club=r[3],
                defectionScore=scores.get(r[0]),
            )
            for r in selected
        ],
        edges=edges,
        provenance=APIBlocsProvenance(
            term=term,
            electronicVotingsInStore=int(electronic[0]) if electronic else 0,
            computedAt=datetime.now(UTC),
            minSharedVotes=MIN_SHARED_VOTES,
            edgeFloor=floor,
            edgeCap=EDGE_CAP,
        ),
    )
