import { cn } from '@/lib/cn';

export interface VoteBarProps {
  yes: number;
  no: number;
  abstain: number;
  /** Total MPs (denominator). Absences = total − yes − no − abstain. */
  total: number;
  /** Omit the numeric labels, show the bar only (§2.7). */
  compact?: boolean;
}

const pct = (n: number, total: number): string =>
  total > 0 ? `${(n / total) * 100}%` : '0%';

/**
 * §2.7 — stacked yes/no/abstain bar for one voting. role=img with a full
 * spoken breakdown; numeric labels below (unless compact) so meaning never
 * rests on colour alone. A dashed line marks the 50% majority threshold.
 */
export function VoteBar({ yes, no, abstain, total, compact = false }: VoteBarProps) {
  const label = `${yes} yes, ${no} no, ${abstain} abstentions`;
  return (
    <div className="w-full">
      <div
        role="img"
        aria-label={label}
        className="relative flex h-2 w-full overflow-hidden rounded-sm bg-bg-tertiary"
      >
        <span className="block h-full bg-positive" style={{ width: pct(yes, total) }} />
        <span className="block h-full bg-negative" style={{ width: pct(no, total) }} />
        <span
          className="block h-full bg-abstain"
          style={{ width: pct(abstain, total) }}
        />
        {/* 50% majority threshold */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 top-0 left-1/2 border-l border-dashed border-border-strong"
        />
      </div>
      {!compact && (
        <div
          aria-hidden="true"
          className={cn(
            'mt-1 flex justify-between font-mono text-xs tabular-nums',
            'text-text-secondary',
          )}
        >
          <span>Yes {yes}</span>
          <span>No {no}</span>
          <span>Abs {abstain}</span>
        </div>
      )}
    </div>
  );
}

export default VoteBar;
