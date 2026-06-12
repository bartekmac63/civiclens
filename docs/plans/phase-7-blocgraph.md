# Phase 7 — BlocGraph (plan + council review)

Status: accepted (self-reviewed; autonomous run). Spec: design-system.md §3.3
(+ §6 prohibitions, §5 a11y). Honesty rule applies: similarity comes only from
real stored votes; insufficient data → excluded, never faked.

## Goal

The co-voting bloc graph: which MPs vote together, regardless of formal club.
Backend computes pairwise co-voting similarity from stored ELECTRONIC votes and
serves it on `/blocs` (currently an honest 501). Frontend renders the §3.3 D3
force-directed graph with always-visible controls and a text-table fallback.

## Definitions (the contract the tests encode)

- **Similarity(a, b)** = agreements / shared, over ELECTRONIC votings where
  **both** MPs cast a countable vote (YES/NO/ABSTAIN). Agreement = identical
  vote value. ABSENT never counts as shared participation.
- **Minimum shared votes**: pairs with `shared < min_shared` (default 10) are
  excluded — too little overlap to claim a similarity, so no number is invented.
  With only 78 stored votings this matters; the response carries provenance
  (votings considered) so the UI can say what the graph is based on.
- **Node cap**: top 200 MPs by defection score (spec: "showing top 200 by
  defection score"); MPs with a `None` defection score rank last.
- **Edge cap**: the API returns edges above a server-side floor (0.5) and the
  client filters further with the threshold slider (§3.3 wants real-time
  updates — filtering client-side avoids a request per slider tick).

## Architecture

```
analysis/metrics.py      + pair_similarities(records, min_shared) -> dict[(a,b), float]
api/routers/blocs.py     GET /blocs?term=&minSimilarity=&maxNodes=  -> APIBlocs
frontend src/pages/BlocsPage.tsx        page: graph + controls + fallback table
frontend src/components/BlocGraph/      D3 wrapper (the §6 inline-style/class carve-out)
```

- `pair_similarities` is pure (TDD against hand-checked fixtures), placed next
  to the other metrics. O(votings × voters) accumulation per pair via per-voting
  grouping; fine at this scale (105k pairs max, 460-voter votings).
- `/blocs` response: `nodes` (mpId, name, club, defectionScore), `edges`
  (a, b, similarity), `provenance` (term, electronic votings, minShared).
- D3 (`d3-force` + `d3-selection`/`d3-drag` — import only the modules needed):
  nodes party-coloured at 80% opacity from `partyColor` tokens, radius 6–18px
  scaled by defection score (None → minimum), edges `--color-border-subtle`
  with opacity 0.1–0.8 by similarity, selected node accent stroke, hover
  tooltip (§3.6), `alphaDecay: 0.05`, simulation paused on `visibilitychange`.
- Controls (always visible, §3.3): similarity threshold `<input type="range">`
  with live value label, party filter checkbox group, ghost Reset.
- A11y: SVG `role="img"` + dynamic `aria-label` ("Force graph of N MPs…, E
  connections above X% threshold"); a toggleable **DataTable of top pairs**
  (rank, MP a, MP b, clubs, similarity) as the §3.3 text alternative.
- Route `/blocs` added to the router + a nav link from the MP list page.

## Testing

- **Maths (offline, hand-checked):** identical voters → 1.0; opposites → 0.0;
  mixed → exact fraction; ABSENT excluded from shared; `min_shared` exclusion.
- **API (seeded test DB):** known 3-MP seed produces the hand-computed edges;
  caps and floors respected; provenance present; OpenAPI lists /blocs as 200.
- **Frontend:** data-prep helpers (node sizing scale, edge filtering, label
  text) unit-tested; page test mocks the client and asserts controls + fallback
  table + aria-label. The D3 simulation itself is exercised in jsdom only for
  mount/unmount (no layout assertions — positions are nondeterministic).

## Council review (self-conducted)

**Statistician.** Raw agreement rate is the right v1 (interpretable, matches
the "co-voting similarity" spec). Kappa/PCA-style corrections can wait for an
audit pass. Including ABSTAIN as a matchable value is correct: jointly
abstaining is co-voting behaviour. `min_shared` guards against 2-vote "100%"
pairs — honesty rule.

**Performance engineer.** 105k pairs is fine server-side; the risk is the
**client**: 200 nodes × up to 20k edges would tank both D3 and the DOM. →
Server floors edges at 0.5 similarity and additionally caps to the top ~2000
edges; the slider then filters client-side (default threshold 0.8). Simulation:
cap ticks via alphaDecay 0.05 (spec), pause when hidden (spec), drag re-heats
with low alpha.

**A11y auditor.** A force graph is inherently visual; the §3.3 fallback table
must be a real DataTable (sortable, captioned), not a hidden dump — and the
aria-label must update with the filtered state. Slider needs a visible label +
`aria-valuetext` as a percentage. Checkbox group needs a fieldset/legend.

**Design-system guard.** D3 is the one sanctioned inline-style/custom-class
zone (`civic-graph` root). Party colours come from `partyColor` tokens; never
hex literals in the component. No gradients on edges; opacity only.

**Verdict:** proceed. Decisions locked: agreement-rate similarity incl.
ABSTAIN-as-vote, min_shared=10, server edge floor 0.5 + top-2000 cap, client
slider default 0.8, d3 micro-modules only.
