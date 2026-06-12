"""FastAPI application for the CivicLens REST API.

Serves MPs, their votes, defection scores, voting topics, and co-voting blocs
from the PostgreSQL store (design-system.md §4). Bills are part of the §4
surface but not yet data-backed (see api.routers.reference).
"""

from fastapi import FastAPI

from api.routers import blocs, mps, reference

app = FastAPI(
    title="CivicLens API",
    description="Parliamentary intelligence over Poland's Sejm open data.",
    version="0.1.0",
)

app.include_router(mps.router)
app.include_router(reference.router)
app.include_router(blocs.router)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    """Service identity."""
    return {"service": "civiclens", "status": "ok"}


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "healthy"}
