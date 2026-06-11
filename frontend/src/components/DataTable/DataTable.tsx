import { useRef, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/cn';

// Per-column alignment, driven by the §2.2 column types (numbers right-aligned).
// The type-param names must match TanStack's for declaration merging, even
// though this augmentation doesn't reference them.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right' | 'center';
  }
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Describes the data for the table caption, e.g. "MPs". */
  caption: string;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
  /** Virtualise once row count exceeds this (§2.2 / ADR-0003). Default 100. */
  virtualizeThreshold?: number;
  rowHeight?: number;
  emptyState?: ReactNode;
}

const alignClass = (align?: 'left' | 'right' | 'center'): string =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

export function DataTable<T>({
  data,
  columns,
  caption,
  getRowId,
  onRowClick,
  selectedRowId,
  virtualizeThreshold = 100,
  rowHeight = 44,
  emptyState,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const virtualize = rows.length > virtualizeThreshold;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
    enabled: virtualize,
  });

  const virtualRows = virtualize ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtualize && virtualRows.length ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualize && virtualRows.length
      ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  const bodyRows = virtualize ? virtualRows.map((vr) => rows[vr.index]) : rows;

  function renderRow(row: (typeof rows)[number]) {
    const selected = selectedRowId !== undefined && row.id === selectedRowId;
    return (
      <tr
        key={row.id}
        aria-selected={onRowClick ? selected : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
        onKeyDown={
          onRowClick
            ? (e) => {
                if (e.key === 'Enter') onRowClick(row.original);
              }
            : undefined
        }
        style={{ height: rowHeight }}
        className={cn(
          'border-b border-border-subtle',
          onRowClick && 'cursor-pointer hover:bg-bg-secondary focus:bg-bg-secondary focus:outline-none',
          selected && 'bg-accent-subtle',
        )}
      >
        {row.getVisibleCells().map((cell) => (
          <td
            key={cell.id}
            className={cn(
              'px-4 py-3 text-base text-text-primary',
              alignClass(cell.column.columnDef.meta?.align),
              selected && 'border-l-2 border-accent',
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="w-full overflow-auto"
      // Dynamic value (§6 inline-style carve-out): only constrain height when
      // virtualising, so the scroll container drives the virtual window.
      style={virtualize ? { maxHeight: '70vh' } : undefined}
    >
      <table className="w-full border-collapse">
        <caption className="px-4 py-2 text-left text-sm text-text-secondary">
          {caption}: {rows.length}
          {data.length !== rows.length ? ` of ${data.length}` : ''}
        </caption>
        <thead className="sticky top-0 bg-bg-primary">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border">
              {hg.headers.map((header) => {
                const sortDir = header.column.getIsSorted();
                const sortable = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sortDir === 'asc'
                        ? 'ascending'
                        : sortDir === 'desc'
                          ? 'descending'
                          : sortable
                            ? 'none'
                            : undefined
                    }
                    className={cn(
                      'px-4 py-3 text-xs font-medium uppercase tracking-label text-text-secondary',
                      alignClass(header.column.columnDef.meta?.align),
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-text-primary"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span aria-hidden="true">
                          {sortDir === 'asc' ? '↑' : sortDir === 'desc' ? '↓' : ''}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllLeafColumns().length} className="p-8 text-center">
                {emptyState ?? (
                  <span className="text-base text-text-secondary">No results.</span>
                )}
              </td>
            </tr>
          ) : (
            <>
              {paddingTop > 0 && <tr style={{ height: paddingTop }} aria-hidden="true" />}
              {bodyRows.map(renderRow)}
              {paddingBottom > 0 && (
                <tr style={{ height: paddingBottom }} aria-hidden="true" />
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
