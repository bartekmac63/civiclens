# Architecture

CivicLens is a one-directional pipeline: open data is mirrored from the Sejm
API, stored, analysed, and served to a frontend. Each stage is a separate,
swappable component.

```
                ┌──────────────────────────────────────────────┐
                │              Sejm REST API                    │
                │          https://api.sejm.gov.pl              │
                │   terms · MPs · clubs · sittings · votings    │
                └───────────────────────┬──────────────────────┘
                                        │  HTTP (no auth)
                                        ▼
                ┌──────────────────────────────────────────────┐
                │              Ingestion (Python)               │
                │   sejm_client.py — fetch + incremental sync   │
                └───────────────────────┬──────────────────────┘
                                        │  upsert
                                        ▼
                ┌──────────────────────────────────────────────┐
                │                 PostgreSQL                     │
                │     MPs · clubs · votings · MP votes           │
                └───────────────────────┬──────────────────────┘
                                        │  query
                                        ▼
                ┌──────────────────────────────────────────────┐
                │              Analysis (Python)                 │
                │  voting_patterns.py — cohesion, rebel score    │
                └───────────────────────┬──────────────────────┘
                                        │  metrics
                                        ▼
                ┌──────────────────────────────────────────────┐
                │              REST API (FastAPI)                │
                │        /mps · /votings · /metrics              │
                └───────────────────────┬──────────────────────┘
                                        │  JSON over HTTP
                                        ▼
                ┌──────────────────────────────────────────────┐
                │          Frontend (React + TypeScript)         │
                │   browse MPs · visualise voting patterns       │
                └──────────────────────────────────────────────┘
```

## Components

| Stage | Component | Responsibility |
|---|---|---|
| Source | Sejm API | Open parliamentary data, no authentication |
| Ingestion | `ingestion/` | Fetch from the API and upsert into PostgreSQL |
| Storage | PostgreSQL | Canonical relational store of MPs, clubs, and votes |
| Analysis | `analysis/` | Compute voting-pattern metrics over stored data |
| Backend | `api/` (FastAPI) | Serve MPs, votings, and metrics over REST |
| Frontend | `frontend/` (React) | Browse and visualise the data |

## Design notes

- **Incremental ingestion.** The pipeline tracks the last ingested voting so
  repeat runs only fetch new records, keeping the mirror cheap to refresh.
- **Analysis reads, never writes the source.** Metrics are derived from the
  stored votes; the storage layer stays the single source of truth.
- **Stateless API.** The FastAPI service computes or reads metrics per request;
  no session state is held server-side.

Status: this describes the intended design. Only skeletons of each stage exist
today — see the per-module READMEs.
