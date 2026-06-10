# CivicLens — Claude Code working notes

Parliamentary intelligence tool built on Poland's Sejm open data API — mirrors
votes, MPs, and clubs into PostgreSQL and adds a voting-pattern analysis layer.

## Stack

- **Ingestion** — Python (`httpx`), incremental sync → `ingestion/`
- **Storage** — PostgreSQL
- **Analysis** — Python (`pandas`, `networkx`): club cohesion, defection/rebel scores → `analysis/`
- **Backend** — FastAPI → `api/`
- **Frontend** — React + TypeScript + Tailwind CSS → `frontend/`
- **Deploy** — Docker / docker-compose

## Architecture

One-directional flow. Analysis reads, never writes, the source data.

```
Sejm API → ingestion → PostgreSQL → analysis → FastAPI → React
```

See `docs/architecture.md` for the full diagram and per-stage responsibilities.

## Commands

Backend (repo root, in the `.venv`):

| Task | Command |
|------|---------|
| Backend deps | `pip install -e ".[dev]"` |
| Lint | `ruff check .` |
| Format check | `ruff format --check .` |
| Types | `mypy ingestion analysis api tests` |
| Test | `pytest` |

Frontend (in `frontend/`):

| Task | Command |
|------|---------|
| Deps | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` (runs `tsc -b` then `vite build`) |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Test | `npm run test` |

Still `[planned]`: PostgreSQL schema/migrations, the real ingestion/analysis/API
logic, and all data components/pages. Mark anything unbuilt `[planned]`/`[TODO]`;
never invent passing commands for code that does not exist.

## Design system — single source of truth

**`docs/design-system.md` is canonical. Never add a token, colour, or component
not defined there. Re-read §6 before any UI work.**

§6 hard prohibitions (mechanically enforced by `.claude/hooks/design-guard.sh`):

- [ ] No hardcoded hex values in component files — use the CSS custom properties from §1
- [ ] No `!important` in any stylesheet
- [ ] No gradients anywhere (buttons, backgrounds, charts)
- [ ] No arbitrary Tailwind values (`w-[237px]`) — use the spacing scale
- [ ] No emoji in the UI
- [ ] Skeletons, never page-level loading spinners
- [ ] No MUI / Chakra / Ant Design — Tailwind + custom components only
- [ ] No animations on data updates (numbers in tables must not animate)
- [ ] No box shadows as decoration — elevation only
- [ ] No inline styles except D3 and dynamic CSS values
- [ ] No "Success!" toasts — say what succeeded ("Data refreshed — 460 MPs loaded")
- [ ] No stats/streak/GitHub widgets in the README or app

Typography: Inter (base) + IBM Plex Mono (all numeric data, `tabular-nums`).
Accent: Polish-red `#DC143C` only — no blues, purples, or extra colours.

## Honesty rule

Never fabricate features, data, or test results. Mark unbuilt things `[planned]`
or `[TODO]`. This repo is referenced in a university application — a truthful
early-stage README is a feature, not a weakness.

## Workflow cadence

brainstorm → write-plan (`docs/plans/`) → council-review → execute-plan (TDD) →
code-review → merge.

- Skip brainstorm for design-system components — the audit (`docs/design-system.md`)
  is already the spec; build to it directly.
- Use TDD for the defection-score and voting-pattern logic — write the tests
  first, they encode the maths.
