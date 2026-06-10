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

| Task | Command | Status |
|------|---------|--------|
| Backend deps | `pip install -e ".[dev]"` | works |
| Lint (Python) | `ruff check .` | works |
| Test (Python) | `pytest` | works (add tests first) |
| Frontend dev | `npm run dev` (in `frontend/`) | **[TODO]** toolchain not set up |
| Frontend build | `npm run build` | **[TODO]** not yet defined |
| Frontend lint | `npm run lint` | **[TODO]** not yet defined |
| Frontend test | `npm run test` | **[TODO]** not yet defined |

Do not invent passing frontend commands — the Vite + React + TS toolchain does
not exist yet. Mark anything unbuilt `[TODO]`.

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
