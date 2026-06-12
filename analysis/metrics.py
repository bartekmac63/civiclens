"""Pure voting-pattern maths over in-memory vote records.

No I/O — every function is a pure function of its input so it can be pinned by
hand-checked tests. The DB-reading shell lives in :mod:`analysis.data`; the
public, DB-backed API lives in :mod:`analysis.voting_patterns`.

Definitions (see docs/plans/phase-3-analysis.md):
- countable vote = YES | NO | ABSTAIN (the MP actually cast it); ABSENT is not.
- club majority on a voting = the modal countable vote among the club's members,
  or None on a tie / no votes.
- defection score = defections / considered votings (None if considered == 0).
- club cohesion = mean Rice index |yes-no|/(yes+no) over votings (None if none).
"""

from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Hashable, Iterable
from dataclasses import dataclass
from itertools import combinations

COUNTABLE = frozenset({"YES", "NO", "ABSTAIN"})


@dataclass(frozen=True, slots=True)
class VoteRecord:
    """One MP's vote on one voting, with the club they sat in at the time."""

    voting_id: Hashable
    mp_id: int
    club: str | None
    vote: str | None


def majority_vote(votes: Iterable[str]) -> str | None:
    """Return the single most common vote, or None on an empty input or a tie."""
    counts = Counter(votes)
    if not counts:
        return None
    ranked = counts.most_common(2)
    if len(ranked) > 1 and ranked[0][1] == ranked[1][1]:
        return None  # tie for the top → no majority
    return ranked[0][0]


def _countable(records: Iterable[VoteRecord]) -> list[VoteRecord]:
    return [r for r in records if r.vote in COUNTABLE and r.club is not None]


def _club_positions(
    records: list[VoteRecord],
) -> dict[tuple[Hashable, str], str | None]:
    """Modal countable vote per (voting, club)."""
    grouped: dict[tuple[Hashable, str], list[str]] = defaultdict(list)
    for r in records:
        assert r.club is not None and r.vote is not None
        grouped[(r.voting_id, r.club)].append(r.vote)
    return {key: majority_vote(votes) for key, votes in grouped.items()}


def defection_scores(records: Iterable[VoteRecord]) -> dict[int, float | None]:
    """Per-MP fraction of considered votings where the MP broke from its club.

    Every MP appearing in ``records`` gets an entry; MPs with no considered
    voting (no countable vote where their club had a majority) map to None.
    """
    all_mps = {r.mp_id for r in records}
    countable = _countable(records)
    positions = _club_positions(countable)

    considered: dict[int, int] = defaultdict(int)
    defections: dict[int, int] = defaultdict(int)
    for r in countable:
        assert r.club is not None
        position = positions[(r.voting_id, r.club)]
        if position is None:
            continue  # club had no majority that voting → not considered
        considered[r.mp_id] += 1
        if r.vote != position:
            defections[r.mp_id] += 1

    return {
        mp: (defections[mp] / considered[mp] if considered[mp] else None)
        for mp in all_mps
    }


def defection_flags(
    records: Iterable[VoteRecord], *, mp_id: int
) -> dict[Hashable, bool | None]:
    """Per-voting defection flags for one MP (the §3.2 timeline's raw data).

    For every voting the MP appears in: True if the MP cast a countable vote
    against their club's majority, False if with it, and None when the voting
    is not considered (MP not countable, no club, or the club had no majority).
    """
    records = list(records)
    countable = _countable(records)
    positions = _club_positions(countable)

    flags: dict[Hashable, bool | None] = {}
    for r in records:
        if r.mp_id != mp_id:
            continue
        if r.vote in COUNTABLE and r.club is not None:
            position = positions[(r.voting_id, r.club)]
            flags[r.voting_id] = None if position is None else r.vote != position
        else:
            flags[r.voting_id] = None
    return flags


def pair_similarities(
    records: Iterable[VoteRecord], *, min_shared: int = 10
) -> dict[tuple[int, int], float]:
    """Co-voting similarity per MP pair (the §3.3 BlocGraph's raw data).

    Similarity = agreements / shared over votings where BOTH MPs cast a
    countable vote (jointly abstaining counts as agreement; ABSENT never counts
    as participation). Pairs with fewer than ``min_shared`` shared votings are
    excluded rather than given an unreliable number. Keys are ``(low, high)``
    MP-id tuples.
    """
    by_voting: dict[Hashable, list[tuple[int, str]]] = defaultdict(list)
    for r in records:
        if r.vote in COUNTABLE:
            assert r.vote is not None
            by_voting[r.voting_id].append((r.mp_id, r.vote))

    shared: dict[tuple[int, int], int] = defaultdict(int)
    agreements: dict[tuple[int, int], int] = defaultdict(int)
    for voters in by_voting.values():
        voters.sort()  # ascending mp_id → pair keys come out (low, high)
        for (mp_a, vote_a), (mp_b, vote_b) in combinations(voters, 2):
            pair = (mp_a, mp_b)
            shared[pair] += 1
            if vote_a == vote_b:
                agreements[pair] += 1

    return {
        pair: agreements[pair] / count
        for pair, count in shared.items()
        if count >= min_shared
    }


def club_cohesion(records: Iterable[VoteRecord]) -> dict[str, float | None]:
    """Per-club mean Rice index over votings with at least one yes/no vote."""
    yes_no: dict[tuple[Hashable, str], list[str]] = defaultdict(list)
    clubs: set[str] = set()
    for r in records:
        if r.club is None:
            continue
        clubs.add(r.club)
        if r.vote in {"YES", "NO"}:
            yes_no[(r.voting_id, r.club)].append(r.vote)

    rice_by_club: dict[str, list[float]] = defaultdict(list)
    for (_, club), votes in yes_no.items():
        yes = votes.count("YES")
        no = votes.count("NO")
        total = yes + no
        if total:
            rice_by_club[club].append(abs(yes - no) / total)

    return {
        club: (sum(rs) / len(rs) if (rs := rice_by_club.get(club, [])) else None)
        for club in clubs
    }
