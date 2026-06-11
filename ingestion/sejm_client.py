"""Client for the Sejm public REST API.

Wraps ``https://api.sejm.gov.pl`` to fetch parliamentary terms, MPs, clubs,
proceedings, and votings (including per-MP votes). The API is fully open and
requires no authentication.

I/O lives here; parsing lives in :mod:`ingestion.models`. Every method returns
typed models. Network or HTTP errors propagate as ``httpx`` exceptions — callers
(the sync orchestrator) must fail loudly rather than fabricate data.
"""

from __future__ import annotations

from types import TracebackType

import httpx

from ingestion.models import MP, Club, ProceedingDay, Term, Voting

BASE_URL = "https://api.sejm.gov.pl/sejm"
DEFAULT_TIMEOUT = 30.0


class SejmClient:
    """Thin, typed wrapper over the Sejm REST API."""

    def __init__(
        self,
        base_url: str = BASE_URL,
        *,
        client: httpx.Client | None = None,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._owns_client = client is None
        self._client = client or httpx.Client(timeout=timeout)

    # -- lifecycle ---------------------------------------------------------
    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> SejmClient:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self.close()

    # -- internals ---------------------------------------------------------
    def _get(self, path: str) -> object:
        response = self._client.get(f"{self.base_url}{path}")
        response.raise_for_status()
        return response.json()

    # -- endpoints ---------------------------------------------------------
    def get_terms(self) -> list[Term]:
        data = self._get("/term")
        assert isinstance(data, list)
        return [Term.from_api(t) for t in data]

    def get_mps(self, term: int) -> list[MP]:
        data = self._get(f"/term{term}/MP")
        assert isinstance(data, list)
        return [MP.from_api(m, term=term) for m in data]

    def get_clubs(self, term: int) -> list[Club]:
        data = self._get(f"/term{term}/clubs")
        assert isinstance(data, list)
        return [Club.from_api(c, term=term) for c in data]

    def get_proceedings(self, term: int) -> list[ProceedingDay]:
        """Return the votings index — one entry per sitting-day."""
        data = self._get(f"/term{term}/votings")
        assert isinstance(data, list)
        return [ProceedingDay.from_api(p) for p in data]

    def get_sitting_votings(self, term: int, sitting: int) -> list[Voting]:
        """Return voting summaries (no per-MP votes) for a proceeding."""
        data = self._get(f"/term{term}/votings/{sitting}")
        assert isinstance(data, list)
        return [Voting.from_api(v) for v in data]

    def get_voting(self, term: int, sitting: int, voting_number: int) -> Voting:
        """Return one voting with its per-MP votes."""
        data = self._get(f"/term{term}/votings/{sitting}/{voting_number}")
        assert isinstance(data, dict)
        return Voting.from_api(data)
