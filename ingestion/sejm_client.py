"""Client for the Sejm public REST API.

Wraps https://api.sejm.gov.pl to fetch parliamentary terms, MPs, clubs, and
votings. The API is fully open and requires no authentication.

This module is a skeleton: the method signatures describe the intended surface,
but the request logic is not implemented yet.
"""

BASE_URL = "https://api.sejm.gov.pl/sejm"


class SejmClient:
    """Thin wrapper over the Sejm REST API."""

    def __init__(self, base_url: str = BASE_URL) -> None:
        self.base_url = base_url

    def get_terms(self) -> list[dict]:
        """Return all parliamentary terms."""
        # TODO: GET {base_url}/term
        raise NotImplementedError

    def get_mps(self, term: int) -> list[dict]:
        """Return all MPs for a given term."""
        # TODO: GET {base_url}/term{term}/MP
        raise NotImplementedError

    def get_votings(self, term: int, sitting: int) -> list[dict]:
        """Return all votings held during a given sitting."""
        # TODO: GET {base_url}/term{term}/votings/{sitting}
        raise NotImplementedError
