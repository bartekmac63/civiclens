import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { APIMPDetail, APIVote } from '@/api/types';
import { MPDetailPage } from './MPDetailPage';

vi.mock('@/api/client');
import { fetchMP, fetchMPVotes } from '@/api/client';

const detail: APIMPDetail = {
  id: 1, firstName: 'Andrzej', lastName: 'Adamczyk', club: 'PiS',
  districtName: 'Kraków', defectionScore: 0.03, secondName: null,
  voivodeship: 'małopolskie', profession: 'ekonomista', birthDate: '1959-01-04',
  active: true,
};

const votes: APIVote[] = [
  { sitting: 1, votingNumber: 8, title: 'Budget vote', date: '2023-11-13T15:00:00', kind: 'ELECTRONIC', vote: 'NO', club: 'PiS' },
  { sitting: 1, votingNumber: 9, title: 'Other vote', date: '2023-11-14T15:00:00', kind: 'ELECTRONIC', vote: 'YES', club: 'PiS' },
];

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/mps/${id}`]}>
      <Routes>
        <Route path="/mps/:id" element={<MPDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MPDetailPage (§3.2)', () => {
  beforeEach(() => {
    vi.mocked(fetchMP).mockResolvedValue(detail);
    vi.mocked(fetchMPVotes).mockResolvedValue(votes);
  });

  it('renders the MP header, party badge, and stat cards from the API', async () => {
    renderAt('1');
    expect(await screen.findByRole('heading', { name: 'Andrzej Adamczyk' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Party: PiS' })).toBeInTheDocument();
    // "Votes cast" = 2 countable votes
    expect(screen.getByRole('group', { name: 'Votes cast: 2' })).toBeInTheDocument();
  });

  it('lists the MP votes in a table', async () => {
    renderAt('1');
    expect(await screen.findByText('Budget vote')).toBeInTheDocument();
    expect(screen.getByText('Other vote')).toBeInTheDocument();
  });

  it('shows an error state if the MP cannot be loaded', async () => {
    vi.mocked(fetchMP).mockRejectedValueOnce(new Error('nope'));
    renderAt('1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/load this MP/i);
  });
});
