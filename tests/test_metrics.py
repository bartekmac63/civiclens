"""Hand-checked tests for the analysis maths (pure, no I/O).

Every expected number is computed by hand in the test so a definition change
cannot silently pass. See docs/plans/phase-3-analysis.md for the contract.
"""

from __future__ import annotations

from analysis.metrics import (
    VoteRecord,
    club_cohesion,
    defection_scores,
    majority_vote,
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
