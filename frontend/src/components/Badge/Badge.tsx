import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { partyColor, type PartyName } from '@/tokens';

type BadgeSize = 'default' | 'lg';

type CategoricalVariant =
  | 'vote-yes'
  | 'vote-no'
  | 'vote-abstain'
  | 'status'
  | 'anomaly';

interface BaseProps {
  size?: BadgeSize;
  children?: ReactNode;
}

// Party badges need a party; categorical badges need a text label (§2.3).
export type BadgeProps =
  | (BaseProps & { variant: 'party'; party: PartyName })
  | (BaseProps & { variant: CategoricalVariant; children: ReactNode });

// §2.3 — vote tints use dark text on a light tint of the semantic colour so the
// label clears WCAG AA contrast; meaning is never carried by colour alone.
const CATEGORICAL: Record<CategoricalVariant, string> = {
  'vote-yes': 'bg-positive-subtle text-text-primary',
  'vote-no': 'bg-negative-subtle text-text-primary',
  'vote-abstain': 'bg-abstain-subtle text-text-primary',
  status: 'bg-bg-tertiary text-text-primary',
  anomaly: 'bg-accent text-accent-text',
};

const SIZE: Record<BadgeSize, string> = {
  // height 20px, padding 2px 8px, text-xs (§2.3).
  default: 'h-5 px-2 text-xs',
  // height 24px, padding 4px 10px, text-sm (§2.3 lg).
  lg: 'h-6 px-2.5 text-sm',
};

const BASE =
  'inline-flex items-center rounded-sm font-medium leading-none whitespace-nowrap';

export function Badge(props: BadgeProps) {
  const size = props.size ?? 'default';

  if (props.variant === 'party') {
    const colours = partyColor[props.party];
    const label = props.children ?? props.party;
    return (
      <span
        role="img"
        aria-label={`Party: ${props.party}`}
        // Party colours are real-world branding from the token source, applied
        // as dynamic values (§2.3 / §6 inline-style carve-out) — never hardcoded.
        style={{ backgroundColor: colours.bg, color: colours.text }}
        className={cn(BASE, SIZE[size])}
      >
        {label}
      </span>
    );
  }

  return (
    <span className={cn(BASE, SIZE[size], CATEGORICAL[props.variant])}>
      {props.children}
    </span>
  );
}

export default Badge;
