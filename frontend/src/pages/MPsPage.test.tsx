import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { APIMP } from '@/api/types';
import { MPsPage } from './MPsPage';

vi.mock('@/api/client');
import { fetchMPs } from '@/api/client';

const mps: APIMP[] = [
  { id: 1, firstName: 'Andrzej', lastName: 'Adamczyk', club: 'PiS', districtName: 'Kraków', defectionScore: 0.03 },
  { id: 2, firstName: 'Piotr', lastName: 'Adamowicz', club: 'KO', districtName: 'Gdańsk', defectionScore: 0.5 },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <MPsPage />
    </MemoryRouter>,
  );
}

describe('MPsPage (§3.1)', () => {
  beforeEach(() => {
    vi.mocked(fetchMPs).mockResolvedValue(mps);
  });

  it('shows a skeleton while loading then the MP rows', async () => {
    renderPage();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(await screen.findByText('Adamczyk Andrzej')).toBeInTheDocument();
    expect(screen.getByText('Adamowicz Piotr')).toBeInTheDocument();
  });

  it('filters the table via the search box', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Adamczyk Andrzej');
    await user.type(screen.getByRole('combobox'), 'Adamowicz');
    await waitFor(() =>
      expect(screen.queryByText('Adamczyk Andrzej')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Adamowicz Piotr')).toBeInTheDocument();
  });

  it('surfaces an error state when the API fails', async () => {
    vi.mocked(fetchMPs).mockRejectedValueOnce(new Error('boom'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/load MPs/i);
  });
});
