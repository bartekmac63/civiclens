import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { DefectionScore } from '@/components/DefectionScore';
import { SearchBar, type SearchResult } from '@/components/SearchBar';
import { Skeleton } from '@/components/Skeleton';
import { useMPs } from '@/api/hooks';
import type { APIMP } from '@/api/types';
import { isPartyName } from '@/lib/party';

function ClubBadge({ club }: { club: string | null }) {
  if (isPartyName(club)) return <Badge variant="party" party={club} />;
  if (club) return <Badge variant="status">{club}</Badge>;
  return <span className="text-text-tertiary">—</span>;
}

function matches(mp: APIMP, q: string): boolean {
  const haystack = `${mp.firstName} ${mp.lastName} ${mp.club ?? ''} ${mp.districtName ?? ''}`;
  return haystack.toLowerCase().includes(q.toLowerCase());
}

export function MPsPage() {
  const { data, loading, error } = useMPs(10);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const mps = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (query.trim() ? mps.filter((mp) => matches(mp, query)) : mps),
    [mps, query],
  );

  const columns = useMemo<ColumnDef<APIMP>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (mp) => `${mp.lastName} ${mp.firstName}`,
      },
      {
        id: 'club',
        header: 'Club',
        accessorFn: (mp) => mp.club ?? '',
        cell: (ctx) => <ClubBadge club={ctx.row.original.club} />,
        enableSorting: false,
      },
      {
        id: 'district',
        header: 'District',
        accessorFn: (mp) => mp.districtName ?? '',
      },
      {
        id: 'defection',
        header: 'Defection',
        accessorFn: (mp) => mp.defectionScore ?? -1,
        meta: { align: 'right' },
        cell: (ctx) => {
          const score = ctx.row.original.defectionScore;
          return score === null ? (
            <span className="text-text-tertiary">n/a</span>
          ) : (
            <DefectionScore score={score} />
          );
        },
      },
    ],
    [],
  );

  const searchResults: SearchResult[] = filtered.slice(0, 8).map((mp) => ({
    id: mp.id,
    label: `${mp.firstName} ${mp.lastName}`,
    sublabel: mp.club ?? undefined,
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-medium text-text-primary">Members of the Sejm</h1>
      <p className="mt-1 text-sm text-text-secondary">
        10th term · defection score = share of votes against the club majority
      </p>

      <div className="mt-6 max-w-md">
        <SearchBar
          onQueryChange={setQuery}
          results={searchResults}
          onSelect={(r) => navigate(`/mps/${r.id}`)}
          placeholder="Search MPs by name, club, or district"
        />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState message="Couldn't load MPs. Is the API running?" />
        ) : loading ? (
          <LoadingTable />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            caption="MPs"
            getRowId={(mp) => String(mp.id)}
            onRowClick={(mp) => navigate(`/mps/${mp.id}`)}
            emptyState={<EmptyState onClear={() => setQuery('')} />}
          />
        )}
      </div>
    </div>
  );
}

function LoadingTable() {
  // Skeleton rows, never a page-level spinner (§6/§2.9).
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} height={36} />
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="text-base text-text-secondary">No MPs match your search.</p>
      <p className="text-sm text-text-tertiary">Try a different name or clear the search.</p>
      <div className="mt-2">
        <Button variant="ghost" onClick={onClear}>
          Clear search
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="py-12 text-center text-base text-negative">
      {message}
    </div>
  );
}

export default MPsPage;
