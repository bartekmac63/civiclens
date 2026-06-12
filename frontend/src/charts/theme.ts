/** Recharts theme (§3.4) — built from the design tokens, never Recharts defaults. */
import { color, fontFamily } from '@/tokens';

export const civicChartsTheme = {
  colors: color.data, // primary / secondary / tertiary data-viz series (§1a)
  grid: {
    stroke: 'var(--color-border-subtle)',
    strokeDasharray: '3 3',
  },
  axis: {
    tick: {
      fontSize: 11,
      fill: 'var(--color-text-tertiary)',
      fontFamily: fontFamily.mono,
    },
    line: { stroke: 'var(--color-border-default)' },
  },
  tooltip: {
    contentStyle: {
      background: 'var(--color-bg-elevated)',
      border: '0.5px solid var(--color-border-default)',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: fontFamily.mono,
    },
    labelStyle: { color: 'var(--color-text-primary)' },
  },
} as const;
