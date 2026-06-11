import { cn } from '@/lib/cn';

export interface DefectionScoreProps {
  /** Defection score in the range 0–1. */
  score: number;
  /** Show the numeric label to the right of the bar (default true). */
  showLabel?: boolean;
}

// §2.6 — colour bands: 0–0.2 normal, 0.2–0.5 moderate, 0.5–1.0 flagged.
function fillClass(score: number): string {
  if (score >= 0.5) return 'bg-anomaly';
  if (score >= 0.2) return 'bg-negative opacity-60';
  return 'bg-abstain';
}

/**
 * §2.6 — an 80×4px bar visualising a defection score, with a numeric label.
 * Exposed as a meter for assistive tech.
 */
export function DefectionScore({ score, showLabel = true }: DefectionScoreProps) {
  const clamped = Math.min(1, Math.max(0, score));
  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="meter"
        aria-valuenow={Number(clamped.toFixed(2))}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-label={`Defection score: ${clamped.toFixed(2)}`}
        className="block h-1 w-20 overflow-hidden rounded-full bg-bg-tertiary"
      >
        <span
          className={cn('block h-full rounded-full', fillClass(clamped))}
          style={{ width: `${clamped * 100}%` }}
        />
      </span>
      {showLabel && (
        <span className="font-mono text-xs tabular-nums text-text-secondary">
          {clamped.toFixed(2)}
        </span>
      )}
    </span>
  );
}

export default DefectionScore;
