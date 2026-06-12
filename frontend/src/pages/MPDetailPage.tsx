import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Skeleton } from '@/components/Skeleton';
import { StatCard } from '@/components/StatCard';
import { useMP, useMPVotes } from '@/api/hooks';
import type { APIVote } from '@/api/types';
import { civicChartsTheme } from '@/charts/theme';
import { isPartyName } from '@/lib/party';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface TimelinePoint {
  /** 1-based position among the MP's considered votes, in date order. */
  index: number;
  date: string;
  /** Cumulative defection rate after this vote (0–1). */
  score: number;
  defected: boolean;
}

/** Cumulative defection rate over the MP's considered votes (§3.2 timeline). */
function buildTimeline(votes: APIVote[]): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  let considered = 0;
  let defections = 0;
  for (const vote of votes) {
    if (vote.defected === null) continue; // not considered — no data point
    considered += 1;
    if (vote.defected) defections += 1;
    points.push({
      index: considered,
      date: vote.date,
      score: defections / considered,
      defected: vote.defected,
    });
  }
  return points;
}

// §3.4 — "dot at anomaly points only": mark defections, hide conforming votes.
function TimelineDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: TimelinePoint;
}) {
  const { cx, cy, payload } = props;
  if (!payload?.defected || cx === undefined || cy === undefined) {
    return <circle cx={cx} cy={cy} r={0} fill="none" />;
  }
  return <circle cx={cx} cy={cy} r={3} fill="var(--color-anomaly)" />;
}

const VOTE_BADGE: Record<string, 'vote-yes' | 'vote-no' | 'vote-abstain' | 'status'> = {
  YES: 'vote-yes',
  NO: 'vote-no',
  ABSTAIN: 'vote-abstain',
};

function VoteBadge({ vote }: { vote: string | null }) {
  if (!vote) return <span className="text-text-tertiary">—</span>;
  const variant = VOTE_BADGE[vote] ?? 'status';
  const label = vote.charAt(0) + vote.slice(1).toLowerCase();
  return <Badge variant={variant}>{label}</Badge>;
}

export function MPDetailPage() {
  const { id } = useParams();
  const mpId = Number(id);
  const navigate = useNavigate();
  const mp = useMP(mpId, 10);
  const votes = useMPVotes(mpId, 10);

  const breakdown = useMemo(() => {
    const v = votes.data ?? [];
    const count = (value: string) => v.filter((x) => x.vote === value).length;
    return [
      { name: 'Yes', value: count('YES'), fill: 'var(--color-positive)' },
      { name: 'No', value: count('NO'), fill: 'var(--color-negative)' },
      { name: 'Abstain', value: count('ABSTAIN'), fill: 'var(--color-abstain)' },
      { name: 'Absent', value: count('ABSENT'), fill: 'var(--color-data-3)' },
    ];
  }, [votes.data]);

  const timeline = useMemo(() => buildTimeline(votes.data ?? []), [votes.data]);

  const columns = useMemo<ColumnDef<APIVote>[]>(
    () => [
      { id: 'title', header: 'Voting', accessorFn: (v) => v.title },
      {
        id: 'date',
        header: 'Date',
        accessorFn: (v) => v.date,
        meta: { align: 'right' },
        cell: (ctx) => (
          <span className="font-mono text-sm tabular-nums">
            {formatDate(ctx.row.original.date)}
          </span>
        ),
      },
      {
        id: 'vote',
        header: 'Vote',
        accessorFn: (v) => v.vote ?? '',
        cell: (ctx) => <VoteBadge vote={ctx.row.original.vote} />,
        enableSorting: false,
      },
    ],
    [],
  );

  if (mp.error) {
    return (
      <Shell onBack={() => navigate('/')}>
        <p role="alert" className="text-negative">
          Couldn&rsquo;t load this MP. Is the API running?
        </p>
      </Shell>
    );
  }

  if (mp.loading || !mp.data) {
    return (
      <Shell onBack={() => navigate('/')}>
        <Skeleton width="40%" height={28} />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={72} radius="md" />
          ))}
        </div>
      </Shell>
    );
  }

  const data = mp.data;
  const v = votes.data ?? [];
  const cast = v.filter((x) => ['YES', 'NO', 'ABSTAIN'].includes(x.vote ?? '')).length;
  const score = data.defectionScore;

  return (
    <Shell onBack={() => navigate('/')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">
            {data.firstName} {data.lastName}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {data.districtName ?? 'Unknown district'}
            {data.voivodeship ? ` · ${data.voivodeship}` : ''}
          </p>
        </div>
        {isPartyName(data.club) ? (
          <Badge variant="party" party={data.club} size="lg" />
        ) : data.club ? (
          <Badge variant="status" size="lg">
            {data.club}
          </Badge>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Votes cast" value={cast} loading={votes.loading} />
        <StatCard label="Yes" value={breakdown[0].value} loading={votes.loading} />
        <StatCard label="No" value={breakdown[1].value} loading={votes.loading} />
        <StatCard
          label="Defection"
          value={score === null ? 'n/a' : score.toFixed(2)}
          accentOnAnomaly={score !== null && score >= 0.5}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-text-primary">
          Defection score over time
        </h2>
        {timeline.length > 0 ? (
          <>
            <div
              className="mt-3 h-48 w-full"
              role="img"
              aria-label={`Cumulative defection rate over ${timeline.length} considered votes, ending at ${timeline[timeline.length - 1].score.toFixed(2)}. Dots mark defections.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 8, right: 8 }}>
                  <XAxis
                    dataKey="index"
                    tick={civicChartsTheme.axis.tick}
                    axisLine={civicChartsTheme.axis.line}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={civicChartsTheme.axis.tick}
                    axisLine={civicChartsTheme.axis.line}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={civicChartsTheme.tooltip.contentStyle}
                    labelStyle={civicChartsTheme.tooltip.labelStyle}
                    formatter={(value) => [Number(value).toFixed(3), 'score']}
                    labelFormatter={(index) => `Vote ${index}`}
                  />
                  {/* §3.4: single line, no fill, dot at anomaly points only. */}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-data-1)"
                    strokeWidth={1.5}
                    fill="none"
                    dot={<TimelineDot />}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-sm text-text-tertiary">
              Cumulative share of considered votes cast against the club
              majority; red dots mark individual defections.
            </p>
          </>
        ) : votes.loading ? (
          <div className="mt-3">
            <Skeleton height={192} radius="md" />
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            Not enough considered votes to chart a defection timeline.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-text-primary">Vote breakdown</h2>
        <div className="mt-3 h-48 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdown} layout="vertical" margin={{ left: 16 }}>
              <XAxis type="number" tick={civicChartsTheme.axis.tick} axisLine={civicChartsTheme.axis.line} />
              <YAxis type="category" dataKey="name" width={64} tick={civicChartsTheme.axis.tick} axisLine={civicChartsTheme.axis.line} />
              <Tooltip contentStyle={civicChartsTheme.tooltip.contentStyle} labelStyle={civicChartsTheme.tooltip.labelStyle} cursor={{ fill: 'var(--color-bg-secondary)' }} />
              <Bar dataKey="value" radius={2}>
                {breakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          {data.firstName} {data.lastName} cast {cast} countable votes across the
          stored electronic votings.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-text-primary">All votes</h2>
        <div className="mt-3">
          {votes.loading ? (
            <Skeleton height={160} radius="md" />
          ) : (
            <DataTable
              data={v}
              columns={columns}
              caption="Votes"
              getRowId={(row) => `${row.sitting}-${row.votingNumber}`}
              emptyState={
                <span className="text-base text-text-secondary">
                  No stored votes for this MP.
                </span>
              }
            />
          )}
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Button variant="ghost" onClick={onBack}>
        ← Back
      </Button>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default MPDetailPage;
