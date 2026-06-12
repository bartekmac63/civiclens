"""Topics (real, from votings) and the §4 routes not yet backed by data.

/topics is derived from the ``topic`` recorded on real votings. The /bills
routes are part of the §4 surface but bills (Sejm "prints") are not ingested
yet; rather than fabricate data they return 501 with an honest note. /blocs
became real in Phase 7 — see api.routers.blocs.
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
