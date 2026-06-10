# CivicLens — Design System Audit

**Prepared for:** Claude Code  
**Project:** CivicLens — Open-source parliamentary intelligence tool  
**Stack:** React + TypeScript + Tailwind CSS  
**Audit type:** `/design:design-system audit`  
**Scope:** Full system — tokens, components, patterns, accessibility

---

## Summary

| Metric | Value |
|--------|-------|
| Components defined | 12 |
| Tokens specified | 38 |
| Patterns specified | 6 |
| Hardcoded values to resolve | 0 (defined from scratch — enforce from day one) |
| Accessibility baseline | WCAG 2.1 AA |
| Score | Establish as canonical — no deviation permitted |

This audit defines the CivicLens design system from first principles. The goal is a data-dense civic data dashboard that reads as technically credible — not a vibe-coded Bootstrap clone. Every decision below is deliberate. Claude Code must not deviate from these tokens or introduce new ones without explicit instruction.

---

## 1. Design Tokens

### 1a. Colour palette

CivicLens uses a near-monochrome base with a single meaningful accent. The accent colour is Polish flag red — this is intentional, not decorative. It ties the product visually to its subject matter.

**Do not add more colours. Do not introduce blues, purples, or gradient schemes.**

```
/* Base — neutral grays, light and dark mode aware */
--color-bg-primary:       #FFFFFF  (light) / #0F0F0F  (dark)
--color-bg-secondary:     #F5F5F4  (light) / #1A1A1A  (dark)
--color-bg-tertiary:      #EBEBEA  (light) / #242424  (dark)
--color-bg-elevated:      #FFFFFF  (light) / #222222  (dark)

--color-border-subtle:    #E4E4E3  (light) / #2C2C2A  (dark)
--color-border-default:   #D4D4D2  (light) / #3A3A38  (dark)
--color-border-strong:    #A3A3A0  (light) / #525250  (dark)

--color-text-primary:     #111110  (light) / #F0EFEC  (dark)
--color-text-secondary:   #6B6B69  (light) / #A3A3A0  (dark)
--color-text-tertiary:    #A3A3A0  (light) / #6B6B69  (dark)
--color-text-disabled:    #D4D4D2  (light) / #3A3A38  (dark)

/* Accent — Polish flag red. Use sparingly: primary CTAs, active states, anomaly highlights */
--color-accent:           #DC143C
--color-accent-hover:     #B01030
--color-accent-subtle:    #FEE7EC  (light) / #2D0A12  (dark)
--color-accent-text:      #FFFFFF  (on accent bg)

/* Semantic — data states only. Not for UI decoration. */
--color-positive:         #1D9E75   /* voting yes / trend up */
--color-negative:         #D85A30   /* voting no / trend down */
--color-abstain:          #888780   /* abstention / neutral */
--color-anomaly:          #DC143C   /* statistical outlier / alert */

/* Data visualisation — for charts only, not UI */
--color-data-1:           #111110   /* primary series */
--color-data-2:           #6B6B69   /* secondary series */
--color-data-3:           #D4D4D2   /* tertiary / background series */
```

**Tailwind config mapping** — add to `tailwind.config.js` under `extend.colors`:
```js
civiclens: {
  accent:    '#DC143C',
  positive:  '#1D9E75',
  negative:  '#D85A30',
  abstain:   '#888780',
  anomaly:   '#DC143C',
}
```

---

### 1b. Typography

One font family. No decorative display face. Data legibility over personality.

```
--font-family-base:    'Inter', system-ui, sans-serif
--font-family-mono:    'IBM Plex Mono', 'Fira Code', monospace

/* Scale — 8 steps, all in rem */
--font-size-xs:    0.6875rem   /* 11px — table sub-labels, metadata */
--font-size-sm:    0.75rem     /* 12px — secondary body, captions */
--font-size-base:  0.875rem    /* 14px — primary body, table cells */
--font-size-md:    1rem        /* 16px — section introductions */
--font-size-lg:    1.125rem    /* 18px — component headings */
--font-size-xl:    1.25rem     /* 20px — page section titles */
--font-size-2xl:   1.5rem      /* 24px — page-level headings */
--font-size-3xl:   2rem        /* 32px — hero stat numbers only */

/* Weights — two only */
--font-weight-normal: 400
--font-weight-medium: 500

/* Line heights */
--line-height-tight:   1.2    /* headings, stat numbers */
--line-height-base:    1.5    /* body copy */
--line-height-relaxed: 1.7    /* long-form descriptions */

/* Mono use cases */
/* All numeric data in tables: font-family: var(--font-family-mono) */
/* Vote counts, scores, IDs, API response snippets */
/* NEVER use mono for headings or labels */
```

**Critical rules:**
- Numbers in data tables always use `--font-family-mono` with `font-variant-numeric: tabular-nums`
- Never use font-weight 600, 700, or 800 — too heavy against the base palette
- Never mix Inter and system fonts in the same UI surface

---

### 1c. Spacing

Base unit: 4px. All spacing is multiples of 4.

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px

/* Component-specific */
--space-card-padding:      var(--space-6)      /* 24px */
--space-card-padding-sm:   var(--space-4)      /* 16px — compact cards */
--space-table-cell-x:      var(--space-4)      /* 16px */
--space-table-cell-y:      var(--space-3)      /* 12px */
--space-section-gap:       var(--space-12)     /* 48px between page sections */
--space-inline-gap:        var(--space-2)      /* 8px between inline elements */
```

---

### 1d. Border radius

```
--radius-sm:   4px    /* table cells, badges, code snippets */
--radius-md:   8px    /* cards, inputs, dropdowns */
--radius-lg:   12px   /* modal panels, drawer */
--radius-full: 9999px /* pills, avatar circles */
```

---

### 1e. Shadows

Shadows are used only to indicate elevation (z-axis), never for decoration.

```
--shadow-none:    none
--shadow-sm:      0 1px 2px rgba(0,0,0,0.06)   /* subtle lift, inputs on focus */
--shadow-md:      0 4px 12px rgba(0,0,0,0.08)  /* dropdown menus, tooltips */
--shadow-lg:      0 8px 24px rgba(0,0,0,0.12)  /* modals */
```

No glow effects. No coloured shadows. No `box-shadow` as a substitute for border.

---

### 1f. Motion

```
--duration-instant: 0ms      /* immediate feedback (toggle states) */
--duration-fast:    100ms    /* micro-interactions (button press) */
--duration-base:    200ms    /* standard transitions (hover, expand) */
--duration-slow:    400ms    /* larger layout changes (panel open) */

--easing-default:   cubic-bezier(0.16, 1, 0.3, 1)   /* ease-out-expo — snappy feel */
--easing-linear:    linear
```

Respect `prefers-reduced-motion`. All animated elements must have:
```css
@media (prefers-reduced-motion: reduce) {
  /* set duration to 0ms or use opacity-only transitions */
}
```

---

## 2. Component Inventory

### Component completeness

| Component | States | Variants | Accessibility | Priority |
|-----------|--------|----------|---------------|----------|
| Button | ✅ | ✅ | ✅ | P1 |
| Input (text) | ✅ | ✅ | ✅ | P1 |
| DataTable | ✅ | ✅ | ✅ | P1 |
| Badge | ✅ | ✅ | ✅ | P1 |
| StatCard | ✅ | ✅ | ✅ | P1 |
| MPCard | ✅ | ✅ | ✅ | P1 |
| SearchBar | ✅ | ✅ | ✅ | P1 |
| Tooltip | ✅ | ⚠️ | ✅ | P2 |
| Skeleton | ✅ | ✅ | ✅ | P2 |
| VoteBar | ✅ | ✅ | ✅ | P2 |
| DefectionScore | ✅ | ✅ | ✅ | P2 |
| BlocGraph (D3) | ⚠️ | ⚠️ | ⚠️ | P3 |

---

### 2.1 Button

**Description:** Primary user action trigger. Three variants. The accent colour (Polish red) is used only for `primary`. Never use accent for secondary or ghost.

**Variants:**

| Variant | Use when | Background | Text |
|---------|----------|------------|------|
| `primary` | One main action per view (e.g. "Export data") | `--color-accent` | `--color-accent-text` |
| `secondary` | Supporting actions (e.g. "Filter") | `--color-bg-tertiary` | `--color-text-primary` |
| `ghost` | Low-emphasis actions (e.g. "Cancel") | `transparent` | `--color-text-secondary` |

**Sizes:**

| Size | Height | Padding x | Font size |
|------|--------|-----------|-----------|
| `sm` | 28px | 10px | `--font-size-sm` |
| `md` | 36px | 16px | `--font-size-base` |
| `lg` | 44px | 20px | `--font-size-md` |

**States:**

| State | Visual |
|-------|--------|
| Default | As above |
| Hover | Darken bg by 8% (`--color-accent-hover` for primary) |
| Active | Scale(0.98), darken 12% |
| Disabled | Opacity 0.4, cursor not-allowed, no hover effect |
| Loading | Replace label with spinner (24px), preserve width |

**Accessibility:**
- Role: `button` (native `<button>` element, never `<div>`)
- Keyboard: `Enter` and `Space` trigger; `Tab` focusable
- Focus ring: `outline: 2px solid var(--color-accent); outline-offset: 2px`
- Loading state: `aria-disabled="true"` + `aria-busy="true"`
- Disabled state: `disabled` attribute (not just `aria-disabled`)

**Do / Don't:**

| ✅ Do | ❌ Don't |
|-------|---------|
| One primary button per view | Multiple primary buttons on the same page |
| Use `ghost` for cancel/dismiss | Use `primary` for destructive actions |
| Preserve button width during loading | Let button resize when label changes to spinner |

**TypeScript interface:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}
```

---

### 2.2 DataTable

**Description:** The core component of CivicLens. Used for MP lists, vote records, bill listings. Must handle 460 MPs without performance issues (virtualise rows beyond 100).

**Variants:**

| Variant | Use when |
|---------|----------|
| `default` | Standard tabular data |
| `compact` | Dense views (bill vote breakdown) |
| `sortable` | Columns user can sort by clicking header |

**Column types:**
- `text` — left-aligned, `--font-size-base`, `--color-text-primary`
- `number` — right-aligned, `--font-family-mono`, `font-variant-numeric: tabular-nums`
- `score` — right-aligned mono with a `DefectionScore` badge
- `date` — right-aligned mono, format: `DD MMM YYYY`
- `vote` — centred, `VoteBar` component
- `party` — left-aligned with `Badge` component for party name

**States:**

| State | Visual |
|-------|--------|
| Default row | `--color-bg-primary` |
| Hover row | `--color-bg-secondary` |
| Selected row | `--color-accent-subtle` bg, `--color-accent` left border (2px) |
| Loading | `Skeleton` component replaces rows |
| Empty | Empty state component (see Patterns §3.5) |
| Sorted asc | Column header with ↑ icon, `--color-text-primary` |
| Sorted desc | Column header with ↓ icon, `--color-text-primary` |

**Accessibility:**
- Role: native `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`
- Sortable headers: `aria-sort="ascending"` / `"descending"` / `"none"`
- Selected row: `aria-selected="true"`
- Keyboard: Arrow keys navigate rows; `Enter` opens row detail

**Do / Don't:**

| ✅ Do | ❌ Don't |
|-------|---------|
| Virtualise rows beyond 100 | Render 460 MP rows in the DOM naively |
| Right-align all numbers | Mix left and right alignment for the same data type |
| Use tabular-nums for scores | Use proportional-width numerals in number columns |
| Show row count in table caption | Leave user unsure how many rows exist |

---

### 2.3 Badge

**Description:** Compact label for categorical data — party affiliation, vote type, bill status.

**Variants:**

| Variant | Token | Use case |
|---------|-------|----------|
| `party` | Custom per party (see below) | Party name on MP rows |
| `vote-yes` | `--color-positive` bg tint | "Yes" vote |
| `vote-no` | `--color-negative` bg tint | "No" vote |
| `vote-abstain` | `--color-abstain` bg tint | "Abstain" / "Absent" |
| `status` | `--color-bg-tertiary` | Bill status (passed, pending) |
| `anomaly` | `--color-anomaly` accent | Flagged statistical outlier |

**Party colours** (Polish Sejm, 10th term, 2023–):
```
KO (Civic Coalition):          #F5A623 bg / #7A4F00 text
PiS (Law and Justice):         #003F8F bg / #FFFFFF text
TD (Third Way):                #2E7D32 bg / #FFFFFF text
Lewica (Left):                 #C62828 bg / #FFFFFF text
Konfederacja (Confederation):  #1A237E bg / #FFFFFF text
PSL-TD:                        #4CAF50 bg / #1A3A1A text
```

Note: these are hardcoded party colours, not design tokens — they represent real-world party branding and should not be changed.

**Sizes:**
- Default: height 20px, font-size `--font-size-xs`, padding `2px 8px`, `--radius-sm`
- `lg`: height 24px, font-size `--font-size-sm`, padding `4px 10px`

**Accessibility:**
- Role: `<span>` with `role="status"` for live vote count badges, `role="img"` with `aria-label` for party badges
- Never convey meaning by colour alone — always include text label

---

### 2.4 StatCard

**Description:** Single-metric display. Used in dashboard summary row: total MPs, bills this term, average defection score, anomalies detected.

**Props:**

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Short muted label above the number |
| `value` | `string \| number` | The primary number or formatted string |
| `delta` | `number?` | Optional percentage change (shows ↑↓ with semantic colour) |
| `loading` | `boolean?` | Shows skeleton instead |
| `accentOnAnomaly` | `boolean?` | If true, shows `--color-anomaly` text on value |

**Visual spec:**
- Background: `--color-bg-secondary`
- Border: none (metric cards use background distinction, not border)
- Padding: `--space-card-padding-sm` (16px)
- Label: `--font-size-xs`, `--color-text-secondary`, `--font-weight-normal`, uppercase, 0.06em letter-spacing
- Value: `--font-size-3xl` (32px), `--font-weight-medium`, `--font-family-mono`, `--color-text-primary`
- Delta: `--font-size-sm`, positive = `--color-positive`, negative = `--color-negative`

**States:**

| State | Visual |
|-------|--------|
| Default | As above |
| Loading | Skeleton at label height + value height |
| Anomaly | Value text colour changes to `--color-anomaly` |

---

### 2.5 MPCard

**Description:** Compact card representing a single Member of Parliament. Used in search results and as a linked row expansion.

**Layout:**
```
┌─────────────────────────────────────┐
│ [Avatar]  Full name          [Party]│
│           Constituency              │
│           Defection score: 0.34     │
└─────────────────────────────────────┘
```

**Avatar:** Initials circle, 36px. Background derives from party colour (10% opacity). Text is party colour at full opacity.

**Props:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Sejm MP ID |
| `name` | `string` | Full name |
| `party` | `string` | Party abbreviation |
| `constituency` | `string` | Okręg name |
| `defectionScore` | `number` | 0–1 float, two decimal places |
| `onClick` | `() => void` | Navigates to MP detail page |

**States:**

| State | Visual |
|-------|--------|
| Default | `--color-bg-primary`, `--color-border-subtle` |
| Hover | `--color-bg-secondary`, `--color-border-default` |
| Active | Scale(0.99) |
| Loading | Full card skeleton |

---

### 2.6 DefectionScore

**Description:** Inline visual representation of a defection score (0–1). Used in DataTable score column and MPCard.

**Visual:** A horizontal bar, 80px wide × 4px tall. The filled portion uses:
- Score 0–0.2: `--color-abstain` (low defection, normal)
- Score 0.2–0.5: `--color-negative` at 60% opacity (moderate)
- Score 0.5–1.0: `--color-anomaly` (high defection, flagged)

A numeric label (monospace, `--font-size-xs`) appears to the right: `0.74`

**Accessibility:**
- Wrap in `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="1"`, `aria-label="Defection score: 0.74"`

---

### 2.7 VoteBar

**Description:** Stacked horizontal bar showing yes / no / abstain vote breakdown for a single bill or motion.

**Layout:**
```
Yes ███████████░░░░ No  ░░ Abs
    312             98     42
```

**Props:**

| Property | Type | Description |
|----------|------|-------------|
| `yes` | `number` | Count of yes votes |
| `no` | `number` | Count of no votes |
| `abstain` | `number` | Count of abstentions / absences |
| `total` | `number` | Total MPs (for denominator) |
| `compact` | `boolean?` | Omit labels, show bar only |

**Visual:**
- Total bar height: 8px, full width of container, `--radius-sm`
- Yes segment: `--color-positive`
- No segment: `--color-negative`
- Abstain segment: `--color-abstain`
- Majority line: 1px vertical stroke at 50% mark, `--color-border-strong`, dashed

**Accessibility:**
- `role="img"` with `aria-label` containing the full breakdown: "312 yes, 98 no, 42 abstentions"
- Do not rely on colour alone — include the numeric labels below

---

### 2.8 SearchBar

**Description:** Full-width search input for MP name, party, or bill keyword.

**Behaviour:**
- Debounced at 300ms — do not fire on every keystroke
- Clears via × button (visible only when value is non-empty)
- Results appear in a dropdown below (max 8 results, then "See all results" link)
- Keyboard: `↓` moves focus into results; `Esc` closes dropdown and returns focus to input

**Visual:**
- Height: 40px
- Icon: magnifying glass (left-side, 16px, `--color-text-tertiary`)
- Border: `--color-border-default`, `--radius-md`
- Focus: border changes to `--color-text-primary`, `--shadow-sm`
- Placeholder: `--color-text-tertiary`

**Accessibility:**
- `role="combobox"`, `aria-expanded`, `aria-controls` pointing to results listbox
- Results list: `role="listbox"`, each result: `role="option"`, `aria-selected`
- `aria-label="Search MPs and bills"`

---

### 2.9 Skeleton

**Description:** Loading placeholder. Must match the exact dimensions of the content it replaces. Never use a spinner as a page-level loader — always skeleton.

**Usage rule:** Every data-loading component must accept a `loading: boolean` prop and render `<Skeleton>` at the correct dimensions instead of the empty state.

**Visual:**
- Background: `--color-bg-tertiary`
- Animation: opacity pulse from 1 → 0.5 → 1 at 1.5s, `easing-linear`
- `@media (prefers-reduced-motion: reduce)`: set `animation: none`, keep the flat colour

**Props:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `string \| number` | `'100%'` | Width of the placeholder |
| `height` | `string \| number` | `16` | Height in px |
| `radius` | `keyof radii` | `'sm'` | Border radius token |

**Accessibility:**
- Parent container: `aria-busy="true"` while loading
- Skeleton elements: `aria-hidden="true"` — they are decorative

---

## 3. Patterns

### 3.1 Data table with search and filter

The most-used pattern in CivicLens. Used on the MPs page, Bills page, and Voting Records page.

**Structure:**
```
┌──────────────────────────────────────────┐
│ [SearchBar]              [Filter] [Sort] │
│ Showing 312 of 460 MPs                   │
├──────────────────────────────────────────┤
│ [DataTable — virtualised]                │
│ ...                                      │
│ [Pagination or "Load more"]              │
└──────────────────────────────────────────┘
```

**Rules:**
- Filter and sort controls use `Button` variant `secondary`, size `sm`
- Row count shown as `--font-size-sm` `--color-text-secondary`, always updated in real time
- Pagination: only if the dataset is fixed-size; prefer "load more" for API-paginated results
- Empty state: show immediately when filters produce 0 results (see §3.5)

---

### 3.2 MP detail page layout

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│ ← Back         [MP name]                  [Party]   │
├───────────────────────┬─────────────────────────────┤
│  [StatCard row]       │  Defection score timeline   │
│  Total votes          │  (Recharts line chart)      │
│  Yes / No / Abstain   │                             │
│  Defection score      │                             │
├───────────────────────┴─────────────────────────────┤
│  All votes — [DataTable, compact, sortable]         │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Back link: `ghost` Button with ← arrow, top-left
- Party badge: large variant, top-right
- StatCard row: 4 cards in a grid, no border, `--color-bg-secondary` bg
- Charts: Recharts with custom theme matching these tokens (see §3.4)
- Table pagination: show 50 votes per page

---

### 3.3 BlocGraph (D3 force-directed)

**Description:** The graph view of co-voting MP pairs. This is the highest-complexity UI element.

**Visual spec:**
- Node colour: party colour (from Badge party map) at 80% opacity
- Node size: scales with defection score (min 6px, max 18px radius)
- Edge colour: `--color-border-subtle`, opacity scales with co-voting similarity (0.1–0.8)
- Background: `--color-bg-primary`
- Selected node: `--color-accent` stroke, 2px, `--radius-full`
- Hover node: tooltip (see §3.6)

**Controls (always visible, not behind a menu):**
- Similarity threshold slider: `<input type="range">`, `--font-size-sm` label, real-time graph update
- Party filter: multi-select checkbox group, one per party
- Reset button: `ghost` variant

**Performance rules:**
- Cap rendered nodes at 200 by default (show "showing top 200 by defection score")
- Use `d3-force` simulation with `alphaDecay: 0.05` to prevent infinite ticking
- Pause simulation when tab is not visible (`document.addEventListener('visibilitychange')`)

**Accessibility:**
- `role="img"` on the SVG with `aria-label` describing the graph state: "Force graph of 200 MPs connected by voting similarity. 47 connections above 80% threshold."
- Provide a text-based alternative view (DataTable of top MP pairs by similarity score)

---

### 3.4 Charts (Recharts)

All Recharts components must use this theme. Do not use Recharts default colours.

**Global Recharts theme object:**
```typescript
const civicChartsTheme = {
  colors: ['#111110', '#6B6B69', '#D4D4D2'],
  grid: {
    stroke: 'var(--color-border-subtle)',
    strokeDasharray: '3 3',
  },
  axis: {
    tick: { fontSize: 11, fill: 'var(--color-text-tertiary)', fontFamily: 'IBM Plex Mono' },
    line: { stroke: 'var(--color-border-default)' },
  },
  tooltip: {
    contentStyle: {
      background: 'var(--color-bg-elevated)',
      border: '0.5px solid var(--color-border-default)',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'IBM Plex Mono',
    },
    labelStyle: { color: 'var(--color-text-primary)' },
  },
};
```

**Specific charts:**
- Topic timeline: `<AreaChart>` with `fillOpacity: 0.08` — keep data-ink ratio high
- Defection score over time: `<LineChart>`, single line, no fill, dot at anomaly points only
- Vote breakdown: `<BarChart>` horizontal, not `VoteBar` component (VoteBar is for inline use only)

---

### 3.5 Empty states

Every list or table must handle the empty state. Never show a blank page or broken layout.

**Pattern:**
```
[Centred in the content area]

  No MPs match your filters.

  Try adjusting the party filter
  or clearing the search term.

  [Clear filters]   ← ghost Button
```

**Rules:**
- Message: `--font-size-base`, `--color-text-secondary`
- Sub-message: `--font-size-sm`, `--color-text-tertiary`
- Action button: `ghost` variant
- No illustrations, no emoji, no cartoon graphics — this is a data tool

---

### 3.6 Tooltip

Used on: DefectionScore bar (explains the calculation), BlocGraph nodes (MP name + score), chart data points.

**Visual:**
- Background: `--color-bg-elevated`
- Border: `0.5px solid var(--color-border-default)`
- Border radius: `--radius-sm`
- Shadow: `--shadow-md`
- Font: `--font-size-sm`, `--color-text-primary`
- Max width: 240px
- Arrow pointer: none — position the tooltip adjacent to the trigger

**Behaviour:**
- Appear on hover after 200ms delay
- Disappear immediately on mouse-out (no delay)
- Never clip outside the viewport — flip sides when near an edge

**Accessibility:**
- `role="tooltip"`, `id` referenced via `aria-describedby` on the trigger element
- Must be keyboard-accessible: appears on `focus` as well as `hover`

---

## 4. Naming Consistency Rules

Claude Code must enforce these naming conventions across all files.

### Component files
```
PascalCase for all React components: MPCard.tsx, DefectionScore.tsx, VoteBar.tsx
camelCase for utility modules: formatScore.ts, useParliamentData.ts
kebab-case for CSS modules (if used): mp-card.module.css
```

### CSS class names (Tailwind utility classes only — no custom class names except for D3)
- Never write `className="blueButton"` or `className="card-container"`
- All styling via Tailwind utility classes
- Exception: D3 visualisation elements use a single `civic-graph` root class

### TypeScript interfaces and types
```typescript
// Interface names: noun, PascalCase
interface MP { }
interface Bill { }
interface VoteRecord { }

// Prop types: ComponentNameProps
interface MPCardProps { }
interface DataTableProps<T> { }

// API response types: prefix with API
interface APIMP { }
interface APIBillsResponse { }
```

### API route naming (FastAPI — must match frontend fetch calls exactly)
```
GET /mps                          → useMPs hook
GET /mps/{id}                     → useMP(id) hook
GET /mps/{id}/votes               → useMPVotes(id) hook
GET /mps/{id}/defection-score     → useMPDefectionScore(id) hook
GET /bills                        → useBills hook
GET /bills/{id}                   → useBill(id) hook
GET /blocs                        → useBlocs hook
GET /topics                       → useTopics hook
```

---

## 5. Accessibility Baseline

This system targets WCAG 2.1 AA minimum. The following must be true for every component:

**Colour contrast:**
- All text: minimum 4.5:1 ratio against background
- Large text (18px+ or 14px bold): minimum 3:1
- UI components and focus indicators: minimum 3:1
- The `--color-accent` (#DC143C) on white (#FFFFFF): 5.26:1 — passes AA

**Keyboard navigation:**
- All interactive elements reachable via `Tab`
- Logical tab order — matches visual reading order
- No keyboard traps except intentional modal focus traps (with `Esc` to escape)
- `SearchBar` dropdown: full arrow-key navigation

**Focus indicators:**
- All focusable elements: `outline: 2px solid var(--color-accent); outline-offset: 2px`
- Never `outline: none` without a custom focus indicator

**Screen reader:**
- All data tables: proper `<caption>`, `<thead>`, `scope` attributes
- All charts: `aria-label` with text summary of the data
- Dynamic content: `aria-live="polite"` on search result counts
- Loading states: `aria-busy="true"` on the container

---

## 6. What Claude Code Must Not Do

The following are anti-patterns that will make CivicLens look vibe-coded. Treat these as hard prohibitions:

1. **No MUI, Chakra, or Ant Design** — these produce immediately recognisable default aesthetics. Tailwind + custom components only.
2. **No box shadows as decoration** — shadows only for functional elevation (dropdown, modal, tooltip).
3. **No gradients** — anywhere. Not on buttons, not on backgrounds, not on charts.
4. **No emoji in the UI** — this is a parliamentary data tool, not a consumer app.
5. **No toast notifications that say "Success!"** — tell the user what succeeded. "Data refreshed — 460 MPs loaded."
6. **No hardcoded hex values in component files** — use only the CSS custom properties defined in §1.
7. **No `!important`** in any stylesheet.
8. **No inline styles except for D3 and dynamic CSS values** (e.g., a width set from a JavaScript variable).
9. **No loading spinners at the page level** — always skeleton loading.
10. **No stats cards, streak counters, or GitHub widgets** — in the README or the app.
11. **No animations on data updates** — numbers changing in a table should not animate. It looks cheap and breaks accessibility.
12. **No arbitrary Tailwind values** (`w-[237px]`) — use the spacing scale.

---

## 7. Priority Actions for Claude Code

In order:

1. Set up `tailwind.config.js` with the full token system from §1 (colours, font sizes, spacing, radius, shadows). This is the foundation everything else depends on.
2. Create `src/tokens.ts` exporting the full token map as a TypeScript object for use in D3 and Recharts.
3. Build `Button`, `Badge`, `Skeleton`, and `StatCard` as standalone components with full prop types and accessibility attributes. These are the primitives everything else uses.
4. Build `DataTable` with virtualisation (use `@tanstack/react-table` + `@tanstack/react-virtual`).
5. Build `MPCard` and `DefectionScore` using the primitives above.
6. Build `VoteBar` and `SearchBar`.
7. Wire up the MP list page using the data table + search pattern from §3.1.
8. Apply the Recharts theme from §3.4 to the defection score timeline chart.
9. Build `BlocGraph` last — it is the most complex and depends on having real data flowing.

---

*End of audit. This document is the single source of truth for CivicLens UI decisions. Raise a new audit pass before introducing any new component or token not defined here.*
