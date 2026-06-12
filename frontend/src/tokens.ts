/**
 * CivicLens design tokens — TypeScript source of truth for JavaScript consumers
 * (D3 force graph, Recharts themes) per docs/design-system.md §1.
 *
 * The CSS custom properties in src/styles/tokens.css and the Tailwind config
 * mirror these values. When a token must be read in JS (e.g. a D3 scale or a
 * Recharts colour array), import it from here — never hardcode a hex value in a
 * component. This file is exempt from the design-guard no-raw-hex rule because
 * it IS the token definition.
 *
 * Mode-dependent colours (bg/text/border) are provided as { light, dark }
 * pairs; read the appropriate side based on the active theme.
 */

export const color = {
  bg: {
    primary: { light: '#FFFFFF', dark: '#0F0F0F' },
    secondary: { light: '#F5F5F4', dark: '#1A1A1A' },
    tertiary: { light: '#EBEBEA', dark: '#242424' },
    elevated: { light: '#FFFFFF', dark: '#222222' },
  },
  border: {
    subtle: { light: '#E4E4E3', dark: '#2C2C2A' },
    default: { light: '#D4D4D2', dark: '#3A3A38' },
    strong: { light: '#A3A3A0', dark: '#525250' },
  },
  text: {
    primary: { light: '#111110', dark: '#F0EFEC' },
    secondary: { light: '#6B6B69', dark: '#A3A3A0' },
    tertiary: { light: '#A3A3A0', dark: '#6B6B69' },
    disabled: { light: '#D4D4D2', dark: '#3A3A38' },
  },
  accent: {
    DEFAULT: '#DC143C',
    hover: '#B01030',
    subtle: { light: '#FEE7EC', dark: '#2D0A12' },
    text: '#FFFFFF',
  },
  // Semantic data states — data only, never UI decoration (§1a).
  positive: '#1D9E75',
  negative: '#D85A30',
  abstain: '#888780',
  anomaly: '#DC143C',
  // Data-visualisation series — charts only (§1a).
  data: ['#111110', '#6B6B69', '#D4D4D2'],
} as const;

/**
 * Party colours (Polish Sejm, 10th term, 2023–). These are real-world party
 * branding, NOT design tokens (§2.3) — do not change or tokenise them.
 */
export const partyColor = {
  KO: { bg: '#F5A623', text: '#7A4F00' },
  PiS: { bg: '#003F8F', text: '#FFFFFF' },
  TD: { bg: '#2E7D32', text: '#FFFFFF' },
  Lewica: { bg: '#C62828', text: '#FFFFFF' },
  Konfederacja: { bg: '#1A237E', text: '#FFFFFF' },
  'PSL-TD': { bg: '#4CAF50', text: '#1A3A1A' },
} as const;

export const fontFamily = {
  base: "'Inter', system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'Fira Code', monospace",
} as const;

// §1b — type scale (8 steps), values in rem.
export const fontSize = {
  xs: '0.6875rem',
  sm: '0.75rem',
  base: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
} as const;

export const lineHeight = {
  tight: 1.2,
  base: 1.5,
  relaxed: 1.7,
} as const;

// §1c — spacing (4px base), values in px.
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// §1d — border radius, values in px (full = pill).
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

// §1e — shadows (elevation only).
export const shadow = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.06)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
} as const;

// §1f — motion.
export const motion = {
  duration: { instant: 0, fast: 100, base: 200, slow: 400 },
  easing: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    linear: 'linear',
  },
} as const;

export const tokens = {
  color,
  partyColor,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  space,
  radius,
  shadow,
  motion,
} as const;

export type Tokens = typeof tokens;
export type PartyName = keyof typeof partyColor;

export default tokens;
