/**
 * axe-core accessibility tests for the key pages (WCAG 2.1 AA, §5).
 *
 * Honest scope note: jsdom does not perform real layout/paint, so axe's
 * color-contrast rule cannot run here (it needs rendered pixels) and is
 * disabled. Contrast was verified at the token level in the design-system
 * audit (§5: the accent red on white is 5.26:1, passes AA). Everything else —
 * roles, names, labels, landmarks-in-scope, ARIA validity, focusable
 * semantics — runs for real against the fully rendered pages.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import type { APIBlocs, APIMP, APIMPDetail, APIVote } from '@/api/types';
import BlocsPage from '@/pages/BlocsPage';
import MPDetailPage from '@/pages/MPDetailPage';
import MPsPage from '@/pages/MPsPage';

expect.extend(axeMatchers);

vi.mock('@/api/client');
import { fetchBlocs, fetchMP, fetchMPVotes, fetchMPs } from '@/api/client';

const AXE_OPTIONS = {
  rules: {
    // Needs real paint; covered at token level by the §5 audit (see above).
    'color-contrast': { enabled: false },
  },
};

const mps: APIMP[] = [
  { id: 1, firstName: 'Andrzej', lastName: 'Adamczyk', club: 'PiS', districtName: 'Kraków', defectionScore: 0.03 },
  { id: 2, firstName: 'Piotr', lastName: 'Adamowicz', club: 'KO', districtName: 'Gdańsk', defectionScore: 0.61 },
];

const detail: APIMPDetail = {
  ...mps[0],
  secondName: null,
  voivodeship: 'małopolskie',
  profession: 'ekonomista',
  birthDate: '1959-01-04',
  active: true,
};

const votes: APIVote[] = [
  { sitting: 1, votingNumber: 8, title: 'Budget vote', date: '2023-11-13T15:00:00', kind: 'ELECTRONIC', vote: 'NO', club: 'PiS', defected: true },
  { sitting: 1, votingNumber: 9, title: 'Other vote', date: '2023-11-14T15:00:00', kind: 'ELECTRONIC', vote: 'YES', club: 'PiS', defected: false },
];

const blocs: APIBlocs = {
  nodes: [
    { id: 1, firstName: 'Andrzej', lastName: 'Adamczyk', club: 'PiS', defectionScore: 0.1 },
    { id: 2, firstName: 'Piotr', lastName: 'Adamowicz', club: 'KO', defectionScore: 0.05 },
  ],
  edges: [{ a: 1, b: 2, similarity: 0.95 }],
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

describe('accessibility (axe, WCAG 2.1 AA)', () => {
  beforeEach(() => {
    vi.mocked(fetchMPs).mockResolvedValue(mps);
    vi.mocked(fetchMP).mockResolvedValue(detail);
    vi.mocked(fetchMPVotes).mockResolvedValue(votes);
    vi.mocked(fetchBlocs).mockResolvedValue(blocs);
  });

  it('MP list page has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <MPsPage />
      </MemoryRouter>,
    );
    await screen.findByText('Adamczyk Andrzej');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('MP detail page has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/mps/1']}>
        <Routes>
          <Route path="/mps/:id" element={<MPDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Andrzej Adamczyk' });
    await screen.findByText('Budget vote');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('blocs page (graph view) has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/blocs']}>
        <BlocsPage />
      </MemoryRouter>,
    );
    await screen.findByLabelText('Similarity threshold');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });
});
