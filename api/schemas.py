"""Typed API response models (Pydantic v2).

Field names are camelCase to match the frontend's TypeScript interfaces
(``APIMP`` etc., per design-system.md §4). Every derived number (defection
score) is wrapped with provenance — the term and the data extent it was
computed from — and is nullable, never a fabricated zero.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel


class APIMP(BaseModel):
    id: int
    firstName: str
    lastName: str
    club: str | None
    districtName: str | None
    defectionScore: float | None


class APIMPDetail(APIMP):
    secondName: str | None
    voivodeship: str | None
    profession: str | None
    birthDate: date | None
    active: bool


class APIVote(BaseModel):
    sitting: int
    votingNumber: int
    title: str
    date: datetime
    kind: str
    vote: str | None
    club: str | None
    # True = voted against the club majority; None = not considered
    # (non-countable vote, no club, or no club majority that voting).
    defected: bool | None


class Provenance(BaseModel):
    term: int
    source: str = "https://api.sejm.gov.pl"
    electronicVotingsInStore: int
    computedAt: datetime


class APIDefectionScore(BaseModel):
    mpId: int
    term: int
    score: float | None
    provenance: Provenance


class APITopic(BaseModel):
    topic: str
    votingCount: int
