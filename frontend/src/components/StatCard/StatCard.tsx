import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/Skeleton';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional percentage change; shows a direction arrow in a semantic colour. */
  delta?: number;
  loading?: boolean;
  /** When true, render the value in the anomaly colour (§2.4). */
  accentOnAnomaly?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  loading = false,
  accentOnAnomaly = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-md bg-bg-secondary p-4" aria-busy="true">
        <Skeleton width="60%" height={11} />
        <div className="mt-2">
          <Skeleton width="40%" height={32} />
        </div>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={`${label}: ${value}`}
      className="rounded-md bg-bg-secondary p-4"
    >
      <p className="text-xs font-normal uppercase tracking-label text-text-secondary">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-mono text-3xl font-medium tabular-nums',
          accentOnAnomaly ? 'text-anomaly' : 'text-text-primary',
        )}
      >
        {value}
      </p>
      {delta !== undefined && <Delta delta={delta} />}
    </div>
  );
}

function Delta({ delta }: { delta: number }) {
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'no change';
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const colour =
    delta > 0 ? 'text-positive' : delta < 0 ? 'text-negative' : 'text-abstain';

  return (
    <p
      className={cn('mt-1 font-mono text-sm tabular-nums', colour)}
      aria-label={`${direction} ${Math.abs(delta)} percent`}
    >
      <span aria-hidden="true">{arrow} </span>
      {Math.abs(delta)}%
    </p>
  );
}

export default StatCard;
