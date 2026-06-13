"""Co-voting bloc data for the §3.3 BlocGraph.

Nodes are the top MPs by defection score (spec: "showing top 200 by defection
score"); edges are pairwise co-voting similarities from real stored votes.
Pairs with too little shared participation are excluded by the analysis layer,
never given an invented number. The response carries provenance (data extent,
floor, cap) so the UI can say exactly what the graph is based on.

The pair computation is O(votings x voters^2), so results are served from the
shared analysis cache (:mod:`analysis.cache`) keyed by the term's data version —
it recomputes only when ingestion adds votings.
"""

from __future__ import annotations

from datetime import UTC, datetime

import psycopg
from analysis import cache
from fastapi import APIRouter, Depends, Query

from api.dependencies import get_conn
from api.schemas import APIBlocEdge, APIBlocNode, APIBlocs, APIBlocsProvenance

router = APIRouter(tags=["blocs"])

MIN_SHARED_VOTES = 10
EDGE_FLOOR = 0.5
EDGE_CAP = 2000


@router.get("/blocs", response_model=APIBlocs)
def get_blocs(
    term: int = 10,
    minSimilarity: float = Query(default=EDGE_FLOOR, ge=0.0, le=1.0),
    maxNodes: int = Query(default=200, ge=2, le=460),
    conn: psycopg.Connection = Depends(get_conn),
) -> APIBlocs:
    similarities = cache.pair_similarities(conn, term, min_shared=MIN_SHARED_VOTES)
    scores = cache.defection_scores(conn, term)

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
