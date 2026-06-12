import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { APIBlocs } from '@/api/types';
import { BlocsPage } from './BlocsPage';

vi.mock('@/api/client');
import { fetchBlocs } from '@/api/client';

const blocs: APIBlocs = {
  nodes: [
    { id: 1, firstName: 'Andrzej', lastName: 'Adamczyk', club: 'PiS', defectionScore: 0.1 },
    { id: 2, firstName: 'Piotr', lastName: 'Adamowicz', club: 'KO', defectionScore: 0.05 },
    { id: 3, firstName: 'Anna', lastName: 'Trzecia', club: 'KO', defectionScore: null },
  ],
  edges: [
    { a: 1, b: 2, similarity: 0.95 },
    { a: 2, b: 3, similarity: 0.7 }, // below the default 0.8 threshold
  ],
  provenance: {
    term: 10,
    source: 'https://api.sejm.gov.pl',
    electronicVotingsInStore: 78,
    computedAt: '2026-06-12T00:00:00Z',
    minSharedVotes: 10,
    edgeFloor: 0.5,
    edgeCap: 2000,
  },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <BlocsPage />
    </MemoryRouter>,
  );
}

describe('BlocsPage (§3.3)', () => {
  beforeEach(() => {
    vi.mocked(fetchBlocs).mockResolvedValue(blocs);
  });

  it('renders the graph with a spoken description of the filtered state', async () => {
    renderPage();
    // Default threshold 0.8 -> only the 0.95 edge counts.
    expect(
      await screen.findByRole('img', {
        name: 'Force graph of 3 MPs connected by voting similarity. 1 connections above 80% threshold.',
      }),
    ).toBeInTheDocument();
  });

  it('shows always-visible controls: slider, party filter, reset', async () => {
    renderPage();
    expect(await screen.findByLabelText('Similarity threshold')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Parties' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'PiS' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('unchecking a party removes its MPs from the graph description', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText('Similarity threshold');
    await user.click(screen.getByRole('checkbox', { name: 'KO' }));
    // 2 KO MPs hidden -> 1 MP left, and the cross-party edge disappears.
    expect(
      screen.getByRole('img', {
        name: 'Force graph of 1 MPs connected by voting similarity. 0 connections above 80% threshold.',
      }),
    ).toBeInTheDocument();
  });

  it('offers the text-table alternative view with the same pairs (§3.3 a11y)', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText('Similarity threshold');
    await user.click(screen.getByRole('button', { name: 'Table view' }));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Andrzej Adamczyk')).toBeInTheDocument();
    expect(screen.getByText('0.9500')).toBeInTheDocument();
  });

  it('states the provenance of the data', async () => {
    renderPage();
    expect(
      await screen.findByText(/from 78 electronic votings/),
    ).toBeInTheDocument();
    expect(screen.getByText(/fewer than 10 shared votes/)).toBeInTheDocument();
  });

  it('surfaces an error state when the API fails', async () => {
    vi.mocked(fetchBlocs).mockRejectedValueOnce(new Error('boom'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/bloc data/i);
  });
});
