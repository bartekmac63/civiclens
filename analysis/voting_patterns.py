"""Voting-pattern analysis over stored Sejm voting data.

Computes club cohesion, cross-club agreement, and per-MP rebel scores from the
MP–vote records held in PostgreSQL.

This module is a skeleton: the functions describe the intended metrics, but the
computations are not implemented yet.
"""


def club_cohesion(term: int) -> dict[str, float]:
    """Return a cohesion score per club for the given term.

    Cohesion measures how consistently a club's members vote together.
    """
    # TODO: group MP votes by club, measure intra-club agreement per voting
    raise NotImplementedError


def rebel_score(mp_id: int) -> float:
    """Return how often an MP votes against their own club's majority."""
    # TODO: compare each of the MP's votes to their club's majority vote
    raise NotImplementedError
