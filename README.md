# CivicLens

> Tracks and analyses the activity of Poland's parliament (the Sejm) for journalists, researchers, and citizens who want machine-readable insight into how their representatives vote.

## Overview

The Sejm publishes a large volume of open data — votes, sittings, MPs, clubs, and interpellations — through a public REST API, but the raw feed is awkward to query and offers no historical or comparative analysis. CivicLens mirrors that data into a relational store and adds an analysis layer on top, so a question like "which MPs break from their club line most often?" becomes a single query rather than a manual scrape. The technically interesting parts are the incremental ingestion pipeline and the voting-pattern analysis over the graph of MP–vote relationships.

## Features

- **Built** — Ingestion pipeline mirroring Sejm terms, MPs, clubs, votings, and individual MP votes into PostgreSQL, with provenance (`fetched_at`) on every row
- **Built** — Incremental sync that fetches only the votings missing since the last run (idempotent upserts; resumable; fails loudly rather than seeding fake data)
- **Built** — Full 10th-term vote corpus ingested: 4,239 votings (4,233 electronic) and ~1.95M individual MP votes through 2026-06-11, with provenance on every row
- **Built** — Voting-pattern analysis: club cohesion (Rice index), per-MP defection scoring with per-vote defection flags, and pairwise co-voting similarity (vectorised with NumPy to stay interactive over ~2M votes) — all developed test-first against hand-checked fixtures; insufficient data yields `null`, never a fabricated zero
- **Built** — REST API (FastAPI, typed responses + OpenAPI): `/mps`, `/mps/{id}`, `/mps/{id}/votes`, `/mps/{id}/defection-score`, `/topics`, `/blocs`, with an in-process analysis cache invalidated automatically when new votings are ingested
- **Built** — React + TypeScript + Tailwind frontend: searchable virtualised MP table, MP detail with a defection-score timeline, and a D3 force-directed co-voting bloc graph with an accessible table fallback
- [planned] Bills (Sejm "prints") ingestion — `/bills` currently returns an honest `501`

## Architecture

Data flows in one direction. The Sejm API is mirrored by an ingestion pipeline into PostgreSQL; an analysis layer computes voting metrics over the stored records; a FastAPI service exposes those results; and a React frontend renders them.

```
Sejm API → ingestion → PostgreSQL → analysis (NLP / graph) → REST API → React frontend
```

See `docs/architecture.md` for the full diagram and `docs/design-system.md` for the canonical UI design system.

## Tech stack

| Component | Technology |
|---|---|
| Ingestion | Python, httpx |
| Storage | PostgreSQL |
| Analysis | Python + NumPy (fixture-tested core) |
| Backend API | FastAPI |
| Frontend | React, TypeScript, Tailwind CSS, TanStack Table/Virtual, D3, Recharts |
| Deployment | Docker, docker-compose |
| CI | GitHub Actions (ruff · mypy · pytest · eslint · tsc · vitest incl. axe-core) |

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (or Docker)

### Installation

```bash
git clone https://github.com/bartekmac63/civiclens.git
cd civiclens
pip install -e ".[dev]"          # backend (ingestion + analysis + API)
cd frontend && npm install      # frontend
```

### Running locally

```bash
docker-compose up -d postgres            # or any local PostgreSQL on :5432
python -m ingestion --term 10            # migrate + ingest (add --max-votings N to bound it)
uvicorn api.main:app --reload --port 8099
cd frontend && npm run dev               # http://localhost:5173
```

The database DSN defaults to `postgresql://civiclens:civiclens@localhost:5432/civiclens`; override with `DATABASE_URL`. The frontend reads the API base from `VITE_API_URL` (default `http://localhost:8099`).

### Tests

```bash
pytest                                   # backend (DB tests auto-skip without Postgres)
cd frontend && npm run test             # frontend, incl. axe-core accessibility checks
```

## Data sources

All data comes from the official Sejm API at https://api.sejm.gov.pl — it is fully open and requires no authentication or API key. Every derived number in the API carries provenance (term, data extent, computed-at).

## Roadmap

- [x] Ingest MPs, clubs, and parliamentary terms
- [x] Ingest votings and individual MP votes
- [x] Incremental sync since last ingestion
- [x] Voting-pattern metrics (cohesion, defection score, co-voting similarity)
- [x] REST API over MPs and metrics
- [x] React frontend (MP list, MP detail, bloc graph)
- [x] CI (GitHub Actions)
- [ ] Bills (Sejm prints) ingestion and `/bills` routes
- [ ] Full-term vote backfill
- [ ] Dockerised API + frontend services

## Contributing

Contributions are welcome — open an issue to discuss a change before sending a pull request.

## License

MIT
