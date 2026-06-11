import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar, type SearchResult } from './SearchBar';

const results: SearchResult[] = [
  { id: 1, label: 'Andrzej Adamczyk', sublabel: 'PiS' },
  { id: 2, label: 'Piotr Adamowicz', sublabel: 'KO' },
];

describe('SearchBar (§2.8)', () => {
  it('is a combobox with an accessible label', () => {
    render(<SearchBar onQueryChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: 'Search MPs and bills' })).toBeInTheDocument();
  });

  it('debounces query changes', async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onQueryChange={onQueryChange} debounceMs={50} />);
    await user.type(screen.getByRole('combobox'), 'Adam');
    await waitFor(() => expect(onQueryChange).toHaveBeenLastCalledWith('Adam'));
  });

  it('opens a listbox of results and selects via keyboard', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchBar onQueryChange={() => {}} results={results} onSelect={onSelect} debounceMs={10} />,
    );
    const input = screen.getByRole('combobox');
    await user.type(input, 'Adam');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);

    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(results[0]);
  });

  it('shows a clear button only when there is text, and clears it', async () => {
    const user = userEvent.setup();
    render(<SearchBar onQueryChange={() => {}} debounceMs={10} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('combobox'), 'x');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('closes the dropdown on Escape', async () => {
    const user = userEvent.setup();
    render(<SearchBar onQueryChange={() => {}} results={results} debounceMs={10} />);
    await user.type(screen.getByRole('combobox'), 'Adam');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
