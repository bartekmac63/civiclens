---
description: Scaffold a CivicLens React component wired to the design tokens, with a11y attributes and a colocated test.
argument-hint: <ComponentName> [one-line purpose]
---

# /new-component — scaffold a token-wired CivicLens component

Scaffold a new React + TypeScript component that conforms to
`docs/design-system.md`. **Re-read that file (especially §1 tokens and §6
prohibitions) before writing any code.**

Component to create: **$ARGUMENTS**

## Rules (non-negotiable — these come from `docs/design-system.md`)

- **Tokens only.** Style via Tailwind utilities mapped to the §1 token scale, or
  the CSS custom properties. No raw hex, no arbitrary Tailwind values
  (`w-[237px]`), no `!important`, no gradients, no inline styles (except D3 /
  dynamic JS values), no emoji.
- **Typography.** Inter for text; `font-mono` + `tabular-nums` for all numeric
  data. Weights 400/500 only.
- **Accessibility (WCAG 2.1 AA).** Native semantic elements (`<button>`, not
  `<div>`); full keyboard support; visible focus ring
  (`outline: 2px solid var(--color-accent); outline-offset: 2px`); correct ARIA
  roles/labels per the component's §2 spec; never colour-only meaning.
- **Loading.** Accept a `loading?: boolean` prop and render `<Skeleton>` at the
  exact content dimensions — never a spinner.
- **Naming.** PascalCase component file; `ComponentNameProps` interface;
  `APIxxx` prefix for API response types.

## Steps

1. Look the component up in `docs/design-system.md` §2. If it is defined there,
   build to that exact spec (variants, sizes, states, props, a11y). If it is
   **not** defined, stop and tell the user a new design-system audit pass is
   required before adding an undefined component (per §0 / end-of-audit rule).
2. Create `frontend/src/components/<ComponentName>/<ComponentName>.tsx` with a
   typed `<ComponentName>Props` interface and full a11y attributes.
3. Create a colocated test `frontend/src/components/<ComponentName>/<ComponentName>.test.tsx`
   covering: default render, each variant/state, keyboard interaction, and the
   `loading` skeleton path.
4. Create `frontend/src/components/<ComponentName>/index.ts` re-exporting it.
5. Run the design guard mentally: no hex, no `!important`, no arbitrary Tailwind,
   no emoji. (The `design-guard` PreToolUse hook will also block violations.)
6. Report the files created and any design-system section you relied on.
