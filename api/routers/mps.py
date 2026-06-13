"""MP routes (design-system.md §4): list, detail, votes, defection score."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import psycopg
from analysis import cache, metrics
from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_conn
from api.schemas import APIMP, APIDefectionScore, APIMPDetail, APIVote, Provenance

router = APIRouter(tags=["mps"])


def _electronic_voting_count(conn: psycopg.Connection, term: int) -> int:
    row = conn.execute(
        "SELECT count(*) FROM votings WHERE term = %s AND kind = 'ELECTRONIC'",
        (term,),
    ).fetchone()
    return int(row[0]) if row else 0


def _require_mp(conn: psycopg.Connection, mp_id: int, term: int) -> tuple[Any, ...]:
    row = conn.execute(
        """
        SELECT id, first_name, last_name, club, district_name,
               second_name, voivodeship, profession, birth_date, active
        FROM mps WHERE term = %s AND id = %s
        """,
        (term, mp_id),
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=404, detail=f"MP {mp_id} not found in term {term}"
        )
    return row


@router.get("/mps", response_model=list[APIMP])
def list_mps(
    term: int = 10, conn: psycopg.Connection = Depends(get_conn)
) -> list[APIMP]:
    scores = cache.defection_scores(conn, term)
    rows = conn.execute(
        """
        SELECT id, first_name, last_name, club, district_name
        FROM mps WHERE term = %s ORDER BY last_name, first_name
        """,
        (term,),
    ).fetchall()
    return [
        APIMP(
            id=r[0],
            firstName=r[1],
            lastName=r[2],
            club=r[3],
            districtName=r[4],
            defectionScore=scores.get(r[0]),
        )
        for r in rows
    ]


@router.get("/mps/{mp_id}", response_model=APIMPDetail)
def get_mp(
    mp_id: int, term: int = 10, conn: psycopg.Connection = Depends(get_conn)
) -> APIMPDetail:
    row = _require_mp(conn, mp_id, term)
    score = cache.defection_scores(conn, term).get(mp_id)
    return APIMPDetail(
        id=row[0],
        firstName=row[1],
        lastName=row[2],
        club=row[3],
        districtName=row[4],
        secondName=row[5],
        voivodeship=row[6],
        profession=row[7],
        birthDate=row[8],
        active=row[9],
        defectionScore=score,
    )


@router.get("/mps/{mp_id}/votes", response_model=list[APIVote])
def get_mp_votes(
    mp_id: int, term: int = 10, conn: psycopg.Connection = Depends(get_conn)
) -> list[APIVote]:
    _require_mp(conn, mp_id, term)
    rows = conn.execute(
        """
        SELECT v.sitting, v.voting_number, v.title, v.voted_at, v.kind,
               mv.vote, mv.club
        FROM mp_votes mv
        JOIN votings v
          ON v.term = mv.term AND v.sitting = mv.sitting
         AND v.voting_number = mv.voting_number
        WHERE mv.term = %s AND mv.mp_id = %s
        ORDER BY v.voted_at, v.voting_number
        """,
        (term, mp_id),
    ).fetchall()
    # Per-vote defection flags need the whole term's votes (club majorities).
    flags = metrics.defection_flags(cache.vote_records(conn, term), mp_id=mp_id)
    return [
        APIVote(
            sitting=r[0],
            votingNumber=r[1],
            title=r[2],
            date=r[3],
            kind=r[4],
            vote=r[5],
            club=r[6],
            defected=flags.get((r[0], r[1])),
        )
        for r in rows
    ]


@router.get("/mps/{mp_id}/defection-score", response_model=APIDefectionScore)
def get_mp_defection_score(
    mp_id: int, term: int = 10, conn: psycopg.Connection = Depends(get_conn)
) -> APIDefectionScore:
    _require_mp(conn, mp_id, term)
    score = cache.defection_scores(conn, term).get(mp_id)
    return APIDefectionScore(
        mpId=mp_id,
        term=term,
        score=score,
        provenance=Provenance(
            term=term,
            electronicVotingsInStore=_electronic_voting_count(conn, term),
            computedAt=datetime.now(UTC),
        ),
    )
