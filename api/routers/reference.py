"""Topics (real, from votings) and the §4 routes not yet backed by data.

/topics is derived from the ``topic`` recorded on real votings. /bills and
/blocs are part of the §4 surface but are not yet served from data: bills
(Sejm "prints") are not ingested, and blocs are the co-voting graph built in
Phase 7. Rather than fabricate data, these return 501 with an honest note.
"""

from __future__ import annotations

import psycopg
from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_conn
from api.schemas import APITopic

router = APIRouter(tags=["reference"])

_PLANNED_BILLS = (
    "Bills (Sejm prints) are not ingested yet — [planned]. "
    "See docs/plans for the roadmap."
)
_PLANNED_BLOCS = "Co-voting blocs are computed by the Phase 7 BlocGraph — [planned]."


@router.get("/topics", response_model=list[APITopic])
def list_topics(
    term: int = 10, conn: psycopg.Connection = Depends(get_conn)
) -> list[APITopic]:
    rows = conn.execute(
        """
        SELECT topic, count(*) AS n
        FROM votings
        WHERE term = %s AND topic IS NOT NULL AND topic <> ''
        GROUP BY topic
        ORDER BY n DESC, topic
        """,
        (term,),
    ).fetchall()
    return [APITopic(topic=r[0], votingCount=r[1]) for r in rows]


@router.get("/bills")
def list_bills() -> None:
    raise HTTPException(status_code=501, detail=_PLANNED_BILLS)


@router.get("/bills/{bill_id}")
def get_bill(bill_id: int) -> None:
    raise HTTPException(status_code=501, detail=_PLANNED_BILLS)


@router.get("/blocs")
def list_blocs() -> None:
    raise HTTPException(status_code=501, detail=_PLANNED_BLOCS)
