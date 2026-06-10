# Frontend module

React + TypeScript + Tailwind frontend for browsing MPs and visualising voting
patterns. Built strictly to `../docs/design-system.md` (the canonical design
system) — every token comes from §1; re-read §6 before any UI work.

## Stack

- **Vite** + **React 18** + **TypeScript** (strict, no `any`)
- **Tailwind CSS v3** — semantic colours map to the CSS custom properties in
  `src/styles/tokens.css`, so light/dark mode switches automatically
- **Vitest** + **Testing Library** for component tests
- **ESLint** (flat config) + `tsc -b` for typecheck

## Token system

The §1 design tokens live in three mirrored places:

- `src/styles/tokens.css` — CSS custom properties (canonical, light + dark)
- `src/tokens.ts` — TypeScript source of truth for JS consumers (D3, Recharts)
- `tailwind.config.js` — maps the tokens to Tailwind utilities

Never hardcode a hex value or token in a component; use a Tailwind utility or a
CSS variable. (The `.claude/hooks/design-guard.sh` hook enforces this.)

## Commands

```bash
npm install        # install dependencies
npm run dev        # start the Vite dev server (http://localhost:5173)
npm run build      # typecheck (tsc -b) + production build
npm run typecheck  # type-only check
npm run lint       # ESLint
npm run test       # run the Vitest suite once
npm run test:watch # watch mode
```
