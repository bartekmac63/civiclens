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

import numpy as np

COUNTABLE = frozenset({"YES", "NO", "ABSTAIN"})
# Integer codes for the vectorised co-voting kernel; 0 means "did not count".
_VOTE_CODE = {"YES": 1, "NO": 2, "ABSTAIN": 3}


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

    Vectorised: with a (votings × MPs) integer vote matrix ``V`` (0 = no
    countable vote), co-participation is ``Pᵀ·P`` and agreements are
    ``Σₖ (V==k)ᵀ·(V==k)``. This keeps the §3.3 graph interactive at full term
    (~2M votes), where the naive per-pair loop took ~45s.
    """
    # Collect countable cells, then index votings and MPs. MP ids are sorted so
    # upper-triangle pairs come out (low, high), matching the documented key order.
    voting_raw: list[Hashable] = []
    mp_raw: list[int] = []
    code_raw: list[int] = []
    for r in records:
        if r.vote in COUNTABLE:
            voting_raw.append(r.voting_id)
            mp_raw.append(r.mp_id)
            code_raw.append(_VOTE_CODE[r.vote])

    if not code_raw:
        return {}

    voting_ids = list(dict.fromkeys(voting_raw))  # first-seen order, deduped
    voting_index = {v: i for i, v in enumerate(voting_ids)}
    mp_ids = sorted(set(mp_raw))
    mp_index = {mp: i for i, mp in enumerate(mp_ids)}
    n_votings, n_mps = len(voting_ids), len(mp_ids)

    # Fill the (votings × MPs) code matrix with one vectorised assignment.
    rows_idx = np.fromiter((voting_index[v] for v in voting_raw), dtype=np.intp)
    cols_idx = np.fromiter((mp_index[m] for m in mp_raw), dtype=np.intp)
    votes = np.zeros((n_votings, n_mps), dtype=np.int8)
    votes[rows_idx, cols_idx] = np.asarray(code_raw, dtype=np.int8)

    # Counts fit exactly in float32 (≤ n_votings ≪ 2²⁴), so we use float matmul
    # to get BLAS acceleration — integer matmul falls back to a slow loop.
    participated = (votes > 0).astype(np.float32)
    shared = participated.T @ participated
    agreements = np.zeros((n_mps, n_mps), dtype=np.float32)
    for code in _VOTE_CODE.values():
        same = (votes == code).astype(np.float32)
        agreements += same.T @ same

    # The matmul produced exact integer counts; recover them and divide in
    # Python so the ratios are bit-identical to a plain agreements/shared.
    rows, cols = np.triu_indices(n_mps, k=1)
    shared_counts = np.rint(shared[rows, cols]).astype(np.int64)
    keep = shared_counts >= min_shared
    rows, cols, shared_counts = rows[keep], cols[keep], shared_counts[keep]
    agree_counts = np.rint(agreements[rows, cols]).astype(np.int64)

    return {
        (mp_ids[i], mp_ids[j]): a / s
        for i, j, a, s in zip(
            rows.tolist(),
            cols.tolist(),
            agree_counts.tolist(),
            shared_counts.tolist(),
            strict=True,
        )
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
