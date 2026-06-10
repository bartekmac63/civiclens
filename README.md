![CivicLens](https://img.shields.io/badge/CivicLens-Parliamentary%20Intelligence-1D9E75?style=flat)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

# CivicLens

> Tracks and analyses the activity of Poland's parliament (the Sejm) for journalists, researchers, and citizens who want machine-readable insight into how their representatives vote.

## Overview

The Sejm publishes a large volume of open data — votes, sittings, MPs, clubs, and interpellations — through a public REST API, but the raw feed is awkward to query and offers no historical or comparative analysis. CivicLens mirrors that data into a relational store and adds an analysis layer on top, so a question like "which MPs break from their club line most often?" becomes a single query rather than a manual scrape. The technically interesting parts are the incremental ingestion pipeline and the voting-pattern analysis over the graph of MP–vote relationships.

## Features

- [planned] Ingestion pipeline mirroring Sejm term, MP, club, and voting data into PostgreSQL
- [planned] Incremental sync that pulls only the votings added since the last run
- [planned] Voting-pattern analysis: club cohesion, cross-club agreement, per-MP rebel scoring
- [planned] REST API exposing MPs, votings, and computed metrics
- [planned] React frontend for browsing MPs and visualising voting patterns

## Architecture

Data flows in one direction. The Sejm API is mirrored by an ingestion pipeline into PostgreSQL; an analysis layer computes voting metrics over the stored records; a FastAPI service exposes those results; and a React frontend renders them.

```
Sejm API → ingestion → PostgreSQL → analysis (NLP / graph) → REST API → React frontend
```

## Tech stack

| Component | Technology |
|---|---|
| Ingestion | Python, httpx |
| Storage | PostgreSQL |
| Analysis | Python, pandas, networkx |
| Backend API | FastAPI |
| Frontend | React, TypeScript |
| Deployment | Docker, docker-compose |

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (or Docker)

### Installation

```bash
# [TODO] these steps work once the modules are implemented
git clone https://github.com/bartekm123abc-byte/civiclens.git
cd civiclens
pip install -e ".[dev]"          # [TODO] backend dependencies
cd frontend && npm install       # [TODO] frontend dependencies
```

### Running locally

```bash
# [TODO] placeholder commands until the services exist
docker-compose up -d postgres    # [TODO] start the database
python -m ingestion.sejm_client  # [TODO] run an initial ingestion
uvicorn api.main:app --reload    # [TODO] start the API
cd frontend && npm run dev       # [TODO] start the frontend
```

## Data sources

All data comes from the official Sejm API at https://api.sejm.gov.pl — it is fully open and requires no authentication or API key.

## Roadmap

- [ ] Ingest MPs, clubs, and parliamentary terms
- [ ] Ingest votings and individual MP votes
- [ ] Incremental sync since last ingestion
- [ ] Voting-pattern metrics (cohesion, rebel score)
- [ ] REST API over MPs and metrics
- [ ] React frontend
- [ ] Dockerised deployment

## Contributing

Contributions are welcome — open an issue to discuss a change before sending a pull request.

## License

MIT
