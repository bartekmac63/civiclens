"""Hand-checked tests for the analysis maths (pure, no I/O).

Every expected number is computed by hand in the test so a definition change
cannot silently pass. See docs/plans/phase-3-analysis.md for the contract.
"""

from __future__ import annotations

from collections.abc import Hashable

from analysis.metrics import (
    VoteRecord,
    club_cohesion,
    defection_flags,
    defection_scores,
    majority_vote,
    pair_similarities,
)


def rec(voting: int, mp: int, club: str, vote: str) -> VoteRecord:
    return VoteRecord(voting_id=voting, mp_id=mp, club=club, vote=vote)


# -- majority_vote ---------------------------------------------------------
def test_majority_is_the_modal_vote() -> None:
    assert majority_vote(["YES"] * 7 + ["NO"]) == "YES"


def test_majority_is_none_on_a_tie() -> None:
    assert majority_vote(["YES", "YES", "NO", "NO"]) is None


def test_majority_of_single_vote_is_that_vote() -> None:
    assert majority_vote(["ABSTAIN"]) == "ABSTAIN"


def test_majority_of_nothing_is_none() -> None:
    assert majority_vote([]) is None


# -- defection_scores ------------------------------------------------------
def test_lone_dissenter_scores_one_others_zero() -> None:
    # Club A votes 7 YES (mp 1..7) and 1 NO (mp 8) on voting 1.
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)]
    records.append(rec(1, 8, "A", "NO"))

    scores = defection_scores(records)
    assert scores[8] == 1.0
    assert all(scores[mp] == 0.0 for mp in range(1, 8))


def test_defection_is_fraction_across_votings() -> None:
    # mp 8 defects on voting 1 (NO vs YES majority) but conforms on voting 2.
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)] + [rec(1, 8, "A", "NO")]
    records += [rec(2, mp, "A", "YES") for mp in range(1, 9)]  # mp 8 conforms
    scores = defection_scores(records)
    assert scores[8] == 0.5  # 1 defection / 2 considered


def test_absent_votes_never_count_as_defection_or_denominator() -> None:
    # mp 8 is ABSENT on voting 2; only voting 1 (a defection) is considered.
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)] + [rec(1, 8, "A", "NO")]
    records += [rec(2, mp, "A", "YES") for mp in range(1, 8)] + [
        rec(2, 8, "A", "ABSENT")
    ]
    scores = defection_scores(records)
    assert scores[8] == 1.0  # 1 defection / 1 considered (the ABSENT is ignored)


def test_score_is_none_when_no_countable_votes() -> None:
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)] + [
        rec(1, 99, "A", "ABSENT")
    ]
    scores = defection_scores(records)
    assert scores[99] is None


def test_voting_excluded_when_club_has_no_majority() -> None:
    # 2 YES / 2 NO is a tie → no majority → not considered for anyone.
    records = [
        rec(1, 1, "A", "YES"),
        rec(1, 2, "A", "YES"),
        rec(1, 3, "A", "NO"),
        rec(1, 4, "A", "NO"),
    ]
    scores = defection_scores(records)
    assert all(scores[mp] is None for mp in range(1, 5))


# -- club_cohesion (Rice index) -------------------------------------------
def test_cohesion_seven_one_split_is_rice_point_75() -> None:
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)] + [rec(1, 8, "A", "NO")]
    # Rice = |7 - 1| / (7 + 1) = 0.75
    assert club_cohesion(records)["A"] == 0.75


def test_cohesion_unanimous_is_one() -> None:
    records = [rec(1, mp, "A", "YES") for mp in range(1, 6)]
    assert club_cohesion(records)["A"] == 1.0


def test_cohesion_even_split_is_zero() -> None:
    records = [rec(1, mp, "A", "YES") for mp in range(1, 6)]
    records += [rec(1, mp, "A", "NO") for mp in range(6, 11)]
    assert club_cohesion(records)["A"] == 0.0


def test_cohesion_ignores_abstentions_in_rice() -> None:
    # 3 YES / 0 NO / 2 ABSTAIN → Rice = |3-0|/(3+0) = 1.0
    records = [rec(1, mp, "A", "YES") for mp in range(1, 4)]
    records += [rec(1, mp, "A", "ABSTAIN") for mp in range(4, 6)]
    assert club_cohesion(records)["A"] == 1.0


def test_cohesion_is_none_when_no_yes_no_votes() -> None:
    records = [rec(1, mp, "A", "ABSTAIN") for mp in range(1, 4)]
    assert club_cohesion(records)["A"] is None


def test_cohesion_averages_across_votings() -> None:
    # voting 1: 7/1 → 0.75 ; voting 2: unanimous → 1.0 ; mean = 0.875
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)] + [rec(1, 8, "A", "NO")]
    records += [rec(2, mp, "A", "YES") for mp in range(1, 9)]
    assert club_cohesion(records)["A"] == 0.875


# -- defection_flags (per-vote, for the §3.2 timeline) ----------------------
def test_flags_mark_only_the_defecting_vote() -> None:
    # Voting 1: mp 8 defects (NO vs YES majority). Voting 2: mp 8 conforms.
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)] + [rec(1, 8, "A", "NO")]
    records += [rec(2, mp, "A", "YES") for mp in range(1, 9)]
    flags = defection_flags(records, mp_id=8)
    assert flags == {1: True, 2: False}


def test_flags_are_none_when_not_considered() -> None:
    # mp 8 ABSENT on voting 1; 2/2 tie on voting 2 -> neither is considered.
    records = [rec(1, mp, "A", "YES") for mp in range(1, 8)] + [
        rec(1, 8, "A", "ABSENT")
    ]
    records += [
        rec(2, 7, "A", "YES"),
        rec(2, 6, "A", "YES"),
        rec(2, 8, "A", "NO"),
        rec(2, 5, "A", "NO"),
    ]
    flags = defection_flags(records, mp_id=8)
    assert flags == {1: None, 2: None}


def test_flags_cover_only_the_requested_mps_votes() -> None:
    records = [rec(1, 1, "A", "YES"), rec(1, 2, "A", "YES")]
    assert defection_flags(records, mp_id=1) == {1: False}


# -- pair_similarities (co-voting, for the §3.3 BlocGraph) -------------------
def test_identical_voters_have_similarity_one() -> None:
    records = []
    for voting in range(1, 4):  # 3 shared votings, always agreeing
        records += [rec(voting, 1, "A", "YES"), rec(voting, 2, "A", "YES")]
    sims = pair_similarities(records, min_shared=3)
    assert sims[(1, 2)] == 1.0


def test_opposite_voters_have_similarity_zero() -> None:
    records = []
    for voting in range(1, 4):
        records += [rec(voting, 1, "A", "YES"), rec(voting, 2, "B", "NO")]
    sims = pair_similarities(records, min_shared=3)
    assert sims[(1, 2)] == 0.0


def test_similarity_is_exact_fraction_and_abstain_can_agree() -> None:
    # v1 agree YES, v2 agree ABSTAIN, v3 disagree, v4 disagree -> 2/4 = 0.5
    records = [
        rec(1, 1, "A", "YES"),
        rec(1, 2, "A", "YES"),
        rec(2, 1, "A", "ABSTAIN"),
        rec(2, 2, "A", "ABSTAIN"),
        rec(3, 1, "A", "YES"),
        rec(3, 2, "A", "NO"),
        rec(4, 1, "A", "NO"),
        rec(4, 2, "A", "YES"),
    ]
    sims = pair_similarities(records, min_shared=4)
    assert sims[(1, 2)] == 0.5


def test_absent_votings_do_not_count_as_shared() -> None:
    # Only v1 is shared (agree); v2 has mp2 ABSENT -> shared=1.
    records = [
        rec(1, 1, "A", "YES"),
        rec(1, 2, "A", "YES"),
        rec(2, 1, "A", "YES"),
        rec(2, 2, "A", "ABSENT"),
    ]
    sims = pair_similarities(records, min_shared=1)
    assert sims[(1, 2)] == 1.0


def test_pairs_below_min_shared_are_excluded_not_faked() -> None:
    records = [rec(1, 1, "A", "YES"), rec(1, 2, "A", "YES")]  # shared = 1
    sims = pair_similarities(records, min_shared=2)
    assert (1, 2) not in sims


def test_pair_keys_are_ordered_low_high() -> None:
    records = [rec(1, 9, "A", "YES"), rec(1, 3, "A", "YES")]
    sims = pair_similarities(records, min_shared=1)
    assert (3, 9) in sims and (9, 3) not in sims


def test_pair_similarities_matches_independent_bruteforce() -> None:
    # Guards the vectorised kernel against a naive reference oracle on a larger,
    # randomised input — covers the all-pairs case the small fixtures don't.
    import random
    from itertools import combinations

    rng = random.Random(20260613)
    choices = ["YES", "NO", "ABSTAIN", "ABSENT"]  # ABSENT is non-countable
    records = [
        rec(voting, mp, "A", rng.choice(choices))
        for voting in range(30)
        for mp in range(12)
        if rng.random() < 0.85  # leave gaps so participation differs per pair
    ]

    # Independent oracle: count shared/agreed over countable co-participation.
    countable = {"YES", "NO", "ABSTAIN"}
    by_voting: dict[Hashable, dict[int, str]] = {}
    for r in records:
        if r.vote in countable:
            by_voting.setdefault(r.voting_id, {})[r.mp_id] = r.vote
    shared: dict[tuple[int, int], int] = {}
    agreed: dict[tuple[int, int], int] = {}
    for votes in by_voting.values():
        for a, b in combinations(sorted(votes), 2):
            shared[(a, b)] = shared.get((a, b), 0) + 1
            if votes[a] == votes[b]:
                agreed[(a, b)] = agreed.get((a, b), 0) + 1
    expected = {pair: agreed.get(pair, 0) / n for pair, n in shared.items() if n >= 5}

    assert pair_similarities(records, min_shared=5) == expected
