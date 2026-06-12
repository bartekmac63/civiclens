import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { useBlocs } from '@/api/hooks';
import type { APIBlocEdge } from '@/api/types';
import { Badge } from '@/components/Badge';
import { BlocGraph, clubsOf, filterEdges } from '@/components/BlocGraph';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Skeleton } from '@/components/Skeleton';
import { isPartyName } from '@/lib/party';

const DEFAULT_THRESHOLD = 0.8;

interface PairRow {
  rank: number;
  a: string;
  aClub: string;
  b: string;
  bClub: string;
  similarity: number;
}

export function BlocsPage() {
  const { data, loading, error } = useBlocs(10);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [hiddenClubs, setHiddenClubs] = useState<ReadonlySet<string>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<'graph' | 'table'>('graph');

  const nodes = useMemo(() => data?.nodes ?? [], [data]);
  const clubs = useMemo(() => clubsOf(nodes), [nodes]);

  const visibleNodes = useMemo(
    () => nodes.filter((n) => !hiddenClubs.has(n.club ?? 'No club')),
    [nodes, hiddenClubs],
  );
  const visibleEdges = useMemo(() => {
    const ids = new Set(visibleNodes.map((n) => n.id));
    return filterEdges(data?.edges ?? [], ids, threshold);
  }, [data, visibleNodes, threshold]);

  const nameOf = useMemo(() => {
    const map = new Map(nodes.map((n) => [n.id, `${n.firstName} ${n.lastName}`]));
    return (id: number) => map.get(id) ?? `MP ${id}`;
  }, [nodes]);
  const clubOf = useMemo(() => {
    const map = new Map(nodes.map((n) => [n.id, n.club ?? '—']));
    return (id: number) => map.get(id) ?? '—';
  }, [nodes]);

  const pairRows = useMemo<PairRow[]>(
    () =>
      [...visibleEdges]
        .sort((x, y) => y.similarity - x.similarity)
        .slice(0, 100)
        .map((e: APIBlocEdge, i) => ({
          rank: i + 1,
          a: nameOf(e.a),
          aClub: clubOf(e.a),
          b: nameOf(e.b),
          bClub: clubOf(e.b),
          similarity: e.similarity,
        })),
    [visibleEdges, nameOf, clubOf],
  );

  const pairColumns = useMemo<ColumnDef<PairRow>[]>(
    () => [
      { id: 'rank', accessorKey: 'rank', header: '#', meta: { align: 'right' } },
      { id: 'a', accessorKey: 'a', header: 'MP A' },
      {
        id: 'aClub',
        accessorKey: 'aClub',
        header: 'Club A',
        cell: (ctx) => <ClubCell club={ctx.row.original.aClub} />,
        enableSorting: false,
      },
      { id: 'b', accessorKey: 'b', header: 'MP B' },
      {
        id: 'bClub',
        accessorKey: 'bClub',
        header: 'Club B',
        cell: (ctx) => <ClubCell club={ctx.row.original.bClub} />,
        enableSorting: false,
      },
      {
        id: 'similarity',
        accessorKey: 'similarity',
        header: 'Similarity',
        meta: { align: 'right' },
        cell: (ctx) => (
          <span className="font-mono text-sm tabular-nums">
            {ctx.row.original.similarity.toFixed(4)}
          </span>
        ),
      },
    ],
    [],
  );

  function toggleClub(club: string) {
    setHiddenClubs((prev) => {
      const next = new Set(prev);
      if (next.has(club)) next.delete(club);
      else next.add(club);
      return next;
    });
  }

  function reset() {
    setThreshold(DEFAULT_THRESHOLD);
    setHiddenClubs(new Set());
    setSelectedId(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        to="/"
        className="text-base text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
      >
        ← MPs
      </Link>
      <h1 className="mt-4 text-2xl font-medium text-text-primary">
        Co-voting blocs
      </h1>
      {data && (
        <p className="mt-1 text-sm text-text-secondary">
          Top {nodes.length} MPs by defection score, from{' '}
          {data.provenance.electronicVotingsInStore} electronic votings · pairs
          with fewer than {data.provenance.minSharedVotes} shared votes are
          excluded
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-8 text-base text-negative">
          Couldn&rsquo;t load bloc data. Is the API running?
        </p>
      ) : loading || !data ? (
        <div className="mt-8" aria-busy="true">
          <Skeleton height={480} radius="md" />
        </div>
      ) : (
        <>
          {/* §3.3 — controls are always visible, never behind a menu. */}
          <div className="mt-6 flex flex-wrap items-end gap-6">
            <div>
              <label
                htmlFor="bloc-threshold"
                className="block text-xs uppercase tracking-label text-text-secondary"
              >
                Similarity threshold
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  id="bloc-threshold"
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={threshold}
                  aria-valuetext={`${Math.round(threshold * 100)} percent`}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="h-1 w-48 cursor-pointer appearance-none rounded-full bg-bg-tertiary accent-accent"
                />
                <span className="font-mono text-sm tabular-nums text-text-primary">
                  {Math.round(threshold * 100)}%
                </span>
              </div>
            </div>

            <fieldset>
              <legend className="text-xs uppercase tracking-label text-text-secondary">
                Parties
              </legend>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {clubs.map((club) => (
                  <label
                    key={club}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenClubs.has(club)}
                      onChange={() => toggleClub(club)}
                      className="h-3.5 w-3.5 cursor-pointer accent-accent"
                    />
                    {club}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setView(view === 'graph' ? 'table' : 'graph')}
              >
                {view === 'graph' ? 'Table view' : 'Graph view'}
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-6">
            {view === 'graph' ? (
              <BlocGraph
                nodes={visibleNodes}
                edges={visibleEdges}
                threshold={threshold}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <DataTable
                data={pairRows}
                columns={pairColumns}
                caption="Top co-voting pairs"
                getRowId={(r) => String(r.rank)}
                emptyState={
                  <span className="text-base text-text-secondary">
                    No pairs above the current threshold.
                  </span>
                }
              />
            )}
          </div>
          <p className="mt-2 text-sm text-text-tertiary">
            {visibleEdges.length} connections above{' '}
            {Math.round(threshold * 100)}% among {visibleNodes.length} MPs. The
            table view lists the same data as text.
          </p>
        </>
      )}
    </div>
  );
}

function ClubCell({ club }: { club: string }) {
  if (isPartyName(club)) return <Badge variant="party" party={club} />;
  if (club !== '—') return <Badge variant="status">{club}</Badge>;
  return <span className="text-text-tertiary">—</span>;
}

export default BlocsPage;
