import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './DataTable';

interface Row {
  id: string;
  name: string;
  score: number;
}

const columns: ColumnDef<Row>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  {
    id: 'score',
    accessorKey: 'score',
    header: 'Score',
    meta: { align: 'right' },
  },
];

const data: Row[] = [
  { id: '1', name: 'Adamczyk', score: 0.3 },
  { id: '2', name: 'Borys', score: 0.1 },
  { id: '3', name: 'Cichy', score: 0.9 },
];

describe('DataTable (§2.2)', () => {
  it('renders a native table with a row-count caption', () => {
    render(<DataTable data={data} columns={columns} caption="MPs" />);
    const table = screen.getByRole('table');
    expect(within(table).getByText(/MPs: 3/)).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });

  it('marks sortable headers and toggles aria-sort on click', async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} caption="MPs" />);
    const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    await user.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await user.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('right-aligns columns marked as such', () => {
    render(<DataTable data={data} columns={columns} caption="MPs" />);
    expect(screen.getByRole('columnheader', { name: /Score/ })).toHaveClass('text-right');
  });

  it('fires onRowClick on click and Enter', async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable data={data} columns={columns} caption="MPs" onRowClick={onRowClick} getRowId={(r) => r.id} />,
    );
    const firstRow = screen.getAllByRole('row')[1]; // row 0 is the header
    await user.click(firstRow);
    firstRow.focus();
    await user.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it('moves focus between rows with the arrow keys (§2.2)', async () => {
    const user = userEvent.setup();
    render(
      <DataTable data={data} columns={columns} caption="MPs" onRowClick={() => {}} getRowId={(r) => r.id} />,
    );
    const [, row1, row2] = screen.getAllByRole('row'); // row 0 = header
    row1.focus();
    await user.keyboard('{ArrowDown}');
    expect(row2).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(row1).toHaveFocus();
  });

  it('captions "X of Y" when a filter hides rows (§3.1)', () => {
    render(
      <DataTable data={data.slice(0, 1)} columns={columns} caption="MPs" totalCount={3} />,
    );
    expect(screen.getByText(/MPs: 1 of 3/)).toBeInTheDocument();
  });

  it('shows an empty state when there is no data', () => {
    render(<DataTable data={[]} columns={columns} caption="MPs" />);
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('renders a large dataset without error and reports the count', () => {
    const many: Row[] = Array.from({ length: 460 }, (_, i) => ({
      id: String(i),
      name: `MP ${i}`,
      score: (i % 100) / 100,
    }));
    render(<DataTable data={many} columns={columns} caption="MPs" />);
    expect(screen.getByText(/MPs: 460/)).toBeInTheDocument();
  });
});
