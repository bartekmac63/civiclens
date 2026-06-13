# CivicLens build status — handoff

Last updated: 2026-06-12. Authoritative phase spec: `CLAUDE_BUILD.md`
(local, gitignored). Operating rules there still apply — honesty, TDD for logic,
design-system for UI, council-review for Phases 2/3/7, verify before "done".

## Git topology

The full phase stack (50 commits, Phases H + 0–8) was integrated into `main`
via PR #3 (merge commit `be193d5`, 2026-06-12) and pushed to
`github.com/bartekm123abc-byte/civiclens`. CI ran for real on GitHub Actions
and passed on the PR, on the merge, and on the follow-up actions-version bump
(`8871617`, checkout/setup-python/setup-node bumped to Node-24 majors ahead of
GitHub's 2026-06-16 forced switch). Work from here: branch off `main`, PR back.

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
| QP | quality pass: per-vote defection flags → §3.2 timeline; DataTable arrow-keys/aria-rowcount/X-of-Y; 404 route | flags cross-check the score endpoint exactly on real data |
| 7 | pair_similarities (TDD), real `/blocs` route, D3 BlocGraph + BlocsPage with text-table fallback | live: 200 nodes / 2000 edges with provenance |
| 8 | axe-core a11y tests (3 pages), GitHub Actions CI (backend + frontend jobs, service Postgres), truthful README | 60 backend + 71 frontend tests green |
| 9 | full-term backfill + scale hardening: PRESENT-vote fix (PR #4), NumPy-vectorised co-voting kernel (47s→0.3s), in-process analysis cache | live: /mps 7ms warm, /blocs 17ms warm on ~2M votes |
| 10 | real Docker deployment: backend + frontend (nginx, /api proxy) images, full `docker compose` stack, `python -m ingestion.migrate` entrypoint, CI compose smoke test | compose smoke test runs in CI (build → up → /health, /mps, 501, frontend proxy) |

**All phases complete.** Tests: **61 backend + 71 frontend = 132**, all green.
Lint/types/build clean; design-guard clean on all UI files. CI has three jobs
(backend, frontend, docker).

## Scale + performance (2026-06-13)

- **Full 10th term ingested**: 4,239 votings (4,233 ELECTRONIC) / **1,947,838 MP
  votes** through 2026-06-11. The bounded 80-voting demo is gone.
- At that scale the analysis recompute-per-request became the bottleneck:
  `pair_similarities` was O(votings × MPs²) ≈ 47s. Rewritten as a NumPy matrix
  kernel (`shared = Pᵀ·P`, `agreements = Σₖ (V==k)ᵀ·(V==k)`, float32 for BLAS) →
  **0.3s**, proven equivalent to the old pure-Python impl by a brute-force test.
- `analysis/cache.py` memoises a term's loaded records + derived scores/
  similarities, keyed by a cheap `(voting count, max voted_at)` signal — a new
  ingest busts it automatically. `/mps` 2.1s→7ms warm, `/blocs` 0.3s→17ms warm.
- NumPy is now a real runtime dependency (it earns its place in this kernel).

## Known honest gaps (don't paper over)

- `/bills`, `/bills/{id}` return **501 [planned]** — bills (Sejm "prints") are
  not ingested. **Decision (2026-06-12): stays [planned]** — it is a whole new
  ingestion domain (separate endpoints, schema, routes) and the honesty rule
  prefers a truthful 501 over a rushed feature. Build it as its own phase if
  ever picked up.
- axe's color-contrast rule can't run under jsdom (no paint); contrast is
  covered at token level by the §5 audit.

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
