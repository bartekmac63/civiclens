"""FastAPI application for the CivicLens REST API.

Serves MPs, their votes, defection scores, and voting topics from the
PostgreSQL store (design-system.md §4). Bills and blocs are part of the §4
surface but are not yet data-backed (see api.routers.reference).
"""

from fastapi import FastAPI

from api.routers import mps, reference

app = FastAPI(
    title="CivicLens API",
    description="Parliamentary intelligence over Poland's Sejm open data.",
    version="0.1.0",
)

app.include_router(mps.router)
app.include_router(reference.router)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    """Service identity."""
    return {"service": "civiclens", "status": "ok"}


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "healthy"}
