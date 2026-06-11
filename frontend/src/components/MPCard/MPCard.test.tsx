import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MPCard } from './MPCard';

const base = {
  id: 1,
  name: 'Andrzej Adamczyk',
  constituency: 'Kraków',
  defectionScore: 0.34,
};

describe('MPCard (§2.5)', () => {
  it('renders name, constituency, and defection score', () => {
    render(<MPCard {...base} party="PiS" />);
    expect(screen.getByText('Andrzej Adamczyk')).toBeInTheDocument();
    expect(screen.getByText('Kraków')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Defection score: 0.34' })).toBeInTheDocument();
  });

  it('shows a branded party badge for a known party', () => {
    render(<MPCard {...base} party="PiS" />);
    expect(screen.getByRole('img', { name: 'Party: PiS' })).toBeInTheDocument();
  });

  it('falls back to a neutral badge for an unknown club', () => {
    render(<MPCard {...base} party="Nowa_Lewica" />);
    expect(screen.getByText('Nowa_Lewica')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('is a keyboard-operable button that fires onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<MPCard {...base} party="KO" onClick={onClick} />);
    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });
});
