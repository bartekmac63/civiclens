# CivicLens build status — handoff

Last updated: 2026-06-11. Written for the next session (switching to Fable 5)
to resume without re-deriving state. Authoritative phase spec: `CLAUDE_BUILD.md`
(local, gitignored). Operating rules there still apply — honesty, TDD for logic,
design-system for UI, council-review for Phases 2/3/7, verify before "done",
don't push without approval.

## Git topology (important)

All work is stacked **linearly on branch `feat/phase-6-pages`** — each phase
branched off the previous, so this one branch contains Phases H + 0–6. `main`
is still at the `chore/claude-setup` merge (`c9f0aa2`); nothing has been pushed.
Continue Phase 7 on a new branch off `feat/phase-6-pages`, and integrate the
whole stack into `main` when ready (with approval).

## Done (all committed, green)

| Phase | What | Evidence |
|---|---|---|
| H | setup branch merged to main; CLAUDE_*.md gitignored | — |
| 0 | Vite+React+TS, full §1 tokens (tokens.css/tokens.ts/tailwind), Vitest + pytest/ruff/mypy | builds, dev boots |
| 1 | Button, Badge, Skeleton, StatCard | a11y + token tests |
| 2 | Real Sejm httpx client, Postgres schema/migrations, idempotent + incremental sync | real run: 499 MPs, 11 clubs, **80 votings / 36,800 votes** |
| 3 | Defection score + Rice cohesion (TDD, pure core) | 460 MPs scored, cohesion 0.87–1.00 on real data |
| 4 | FastAPI §4 routes on real DB + OpenAPI | live-verified; bills/blocs are 501 [planned] |
| 5 | DefectionScore, VoteBar, MPCard, SearchBar, virtualised DataTable | a11y + 460-row tests |
| 6 | MP list (§3.1) + MP detail (§3.2) pages on the real API, router | page tests mock the client |

Tests at handoff: **43 backend + 49 frontend = 92**, all green. Lint/types/build
clean; design-guard clean on all UI files.

## Remaining

- **Phase 7 — BlocGraph (council-review the plan first).** D3 force graph per
  §3.3: node size by defection, party colours, threshold slider, party filter,
  200-node cap, pause on hidden tab, plus the text-table a11y fallback. Wire
  the `/blocs` route (currently 501) to real co-voting data.
- **Phase 8 — harden + document.** axe-core a11y tests on the pages, GitHub
  Actions CI (lint + typecheck + tests, frontend & backend), README updated to
  built-vs-[planned] truthfully (no stats/streak/GitHub widgets).

## Known honest gaps (don't paper over)

- `/bills`, `/bills/{id}`, `/blocs` return **501 [planned]** — bills (Sejm
  "prints") not ingested; blocs are Phase 7.
- MP detail shows a real **vote-breakdown** chart, not a per-vote "defection
  timeline" (§3.2). The timeline needs the API to flag each vote as a defection
  — a small `/mps/{id}/votes` extension (compute via `analysis.metrics`).
- The real ingest is **bounded** to 80 votings (`--max-votings`); a full term is
  thousands. Re-run `python -m ingestion --term 10` (no cap) to backfill; it's
  resumable.

## Local environment (must be running)

- **Postgres 16** (Homebrew, gitignored cluster at `.pgdata/`):
  - start: `/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D .pgdata -o "-p 5432 -k /tmp" -l .pgdata/server.log start`
  - prod DB `civiclens` (real data), test DB `civiclens_test` (tests use this).
  - DSN default: `postgresql://civiclens:civiclens@localhost:5432/civiclens`
- **Backend**: `.venv` (Python 3.14). `ruff check . && ruff format --check . && mypy ingestion analysis api tests && pytest`
- **Frontend** (`frontend/`): `npm run lint && npm run typecheck && npm run test && npm run build`
- **API**: `DATABASE_URL=... uvicorn api.main:app --port 8099`
- **Frontend dev** expects the API at `VITE_API_URL` (default `http://localhost:8099`).

## Resume unattended

From the repo root: `~/.claude/scripts/claude-autoresume.sh "continue the CivicLens build"`
— resumes this conversation and auto-waits through usage-limit resets. Default
model is now Fable 5 (`~/.claude/settings.json`).
