"""FastAPI application skeleton for the CivicLens REST API.

Exposes MPs, votings, and computed voting metrics. Only the health and root
endpoints are implemented; the data routes below are placeholders.
"""

from fastapi import FastAPI

app = FastAPI(
    title="CivicLens API",
    description="Parliamentary intelligence over Poland's Sejm open data.",
    version="0.0.0",
)


@app.get("/")
def root() -> dict[str, str]:
    """Service identity."""
    return {"service": "civiclens", "status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "healthy"}


# TODO: GET /mps      — list MPs for a term
# TODO: GET /votings  — list votings
# TODO: GET /metrics  — computed voting-pattern metrics
