/**
 * CivicLens Tailwind config — implements docs/design-system.md §1.
 *
 * Semantic colours (bg/text/border) reference the CSS custom properties defined
 * in src/styles/tokens.css so light/dark mode switches automatically. Mode-
 * independent values (accent, data states, party colours) and the scales below
 * mirror src/tokens.ts, which is the single source of truth for D3/Recharts.
 * Do not introduce a token here that is not defined in §1.
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // §1b — type scale (8 steps), all in rem, with line heights.
    fontSize: {
      xs: ['0.6875rem', { lineHeight: '1.2' }], // 11px
      sm: ['0.75rem', { lineHeight: '1.5' }], // 12px
      base: ['0.875rem', { lineHeight: '1.5' }], // 14px
      md: ['1rem', { lineHeight: '1.5' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.2' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.2' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '1.2' }], // 24px
      '3xl': ['2rem', { lineHeight: '1.2' }], // 32px
    },
    extend: {
      // §1a — colours. Semantic groups map to CSS vars; accent/data are fixed.
      colors: {
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          elevated: 'var(--color-bg-elevated)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          disabled: 'var(--color-text-disabled)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
          text: 'var(--color-accent-text)',
        },
        positive: 'var(--color-positive)',
        negative: 'var(--color-negative)',
        abstain: 'var(--color-abstain)',
        anomaly: 'var(--color-anomaly)',
        // Subtle tints of the §1 semantic colours, for Badge backgrounds (§2.3).
        // Derived from the canonical tokens — not new colours.
        'positive-subtle': 'color-mix(in srgb, var(--color-positive) 12%, transparent)',
        'negative-subtle': 'color-mix(in srgb, var(--color-negative) 12%, transparent)',
        'abstain-subtle': 'color-mix(in srgb, var(--color-abstain) 14%, transparent)',
        // §1a Tailwind mapping — fixed accent + data states (also in tokens.ts).
        civiclens: {
          accent: '#DC143C',
          'accent-hover': '#B01030',
          positive: '#1D9E75',
          negative: '#D85A30',
          abstain: '#888780',
          anomaly: '#DC143C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        base: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Fira Code"', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
      },
      lineHeight: {
        tight: '1.2',
        base: '1.5',
        relaxed: '1.7',
      },
      letterSpacing: {
        label: '0.06em', // §2.4 StatCard label
      },
      // §2.1 Button active / §2.5 MPCard active — press-down scale.
      scale: {
        98: '0.98',
        99: '0.99',
      },
      // §1d — border radius.
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
      // §1e — shadows (elevation only).
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
      },
      // §1f — motion.
      transitionDuration: {
        instant: '0ms',
        fast: '100ms',
        base: '200ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.16, 1, 0.3, 1)',
        linear: 'linear',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        skeleton: 'skeleton-pulse 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
