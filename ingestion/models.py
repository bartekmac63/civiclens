"""Typed models for Sejm API resources, with pure parsers.

Each ``from_api`` classmethod turns one raw JSON object from
``https://api.sejm.gov.pl`` into a typed record. Parsing is a pure function of
its input (no I/O) so it can be unit-tested against captured fixtures. The
client (``sejm_client``) does the I/O and hands raw dicts here.

Field shapes were verified against live term-10 payloads on 2026-06-11; see
``tests/fixtures/sejm/`` and ``docs/plans/phase-2-ingestion.md``.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

# Per-MP vote values seen in the API. VOTE_VALID is used by ON_LIST votings
# (the yes/no choice lives in ``listVotes``); PRESENT by quorum roll-calls
# ("wniosek o stwierdzenie kworum"); analysis whitelists YES/NO/ABSTAIN.
VOTE_VALUES = frozenset({"YES", "NO", "ABSTAIN", "ABSENT", "VOTE_VALID", "PRESENT"})


def _parse_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


@dataclass(frozen=True, slots=True)
class Term:
    num: int
    date_from: date
    date_to: date | None
    current: bool

    @classmethod
    def from_api(cls, data: dict[str, Any]) -> Term:
        start = _parse_date(data["from"])
        assert start is not None  # the API always provides a term start date
        return cls(
            num=int(data["num"]),
            date_from=start,
            date_to=_parse_date(data.get("to")),
            current=bool(data.get("current", False)),
        )


@dataclass(frozen=True, slots=True)
class MP:
    term: int
    id: int
    first_name: str
    last_name: str
    second_name: str | None
    club: str | None
    district_name: str | None
    district_num: int | None
    voivodeship: str | None
    active: bool
    birth_date: date | None
    profession: str | None

    @classmethod
    def from_api(cls, data: dict[str, Any], *, term: int) -> MP:
        district_num = data.get("districtNum")
        return cls(
            term=term,
            id=int(data["id"]),
            first_name=data["firstName"],
            last_name=data["lastName"],
            second_name=data.get("secondName"),
            club=data.get("club"),
            district_name=data.get("districtName"),
            district_num=int(district_num) if district_num is not None else None,
            voivodeship=data.get("voivodeship"),
            active=bool(data.get("active", False)),
            birth_date=_parse_date(data.get("birthDate")),
            profession=data.get("profession"),
        )


@dataclass(frozen=True, slots=True)
class Club:
    term: int
    id: str
    name: str
    members_count: int

    @classmethod
    def from_api(cls, data: dict[str, Any], *, term: int) -> Club:
        return cls(
            term=term,
            id=data["id"],
            name=data["name"],
            members_count=int(data.get("membersCount", 0)),
        )


@dataclass(frozen=True, slots=True)
class ProceedingDay:
    """One day of a proceeding (sitting), from the votings index."""

    proceeding: int
    date: date
    votings_num: int

    @classmethod
    def from_api(cls, data: dict[str, Any]) -> ProceedingDay:
        day = _parse_date(data["date"])
        assert day is not None
        return cls(
            proceeding=int(data["proceeding"]),
            date=day,
            votings_num=int(data["votingsNum"]),
        )


@dataclass(frozen=True, slots=True)
class MPVote:
    mp_id: int
    club: str | None
    vote: str | None

    @classmethod
    def from_api(cls, data: dict[str, Any]) -> MPVote:
        return cls(
            mp_id=int(data["MP"]),
            club=data.get("club"),
            vote=data.get("vote"),
        )


@dataclass(frozen=True, slots=True)
class Voting:
    term: int
    sitting: int
    voting_number: int
    voted_at: datetime
    title: str
    topic: str | None
    description: str | None
    kind: str
    yes: int
    no: int
    abstain: int
    not_participating: int
    total_voted: int
    majority_type: str | None
    majority_votes: int | None
    sitting_day: int | None
    votes: tuple[MPVote, ...]

    @classmethod
    def from_api(cls, data: dict[str, Any]) -> Voting:
        raw_votes = data.get("votes")
        votes = (
            tuple(MPVote.from_api(v) for v in raw_votes)
            if isinstance(raw_votes, list)
            else ()
        )
        majority_votes = data.get("majorityVotes")
        sitting_day = data.get("sittingDay")
        return cls(
            term=int(data["term"]),
            sitting=int(data["sitting"]),
            voting_number=int(data["votingNumber"]),
            voted_at=datetime.fromisoformat(data["date"]),
            title=data["title"],
            topic=data.get("topic"),
            description=data.get("description"),
            kind=data["kind"],
            yes=int(data.get("yes", 0)),
            no=int(data.get("no", 0)),
            abstain=int(data.get("abstain", 0)),
            not_participating=int(data.get("notParticipating", 0)),
            total_voted=int(data.get("totalVoted", 0)),
            majority_type=data.get("majorityType"),
            majority_votes=int(majority_votes) if majority_votes is not None else None,
            sitting_day=int(sitting_day) if sitting_day is not None else None,
            votes=votes,
        )
