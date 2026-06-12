import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { partyColor } from '@/tokens';

describe('Badge (§2.3)', () => {
  it('renders a categorical vote label as text (not colour alone)', () => {
    render(<Badge variant="vote-yes">Yes</Badge>);
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('exposes a party badge as an image with an accessible label', () => {
    render(<Badge variant="party" party="KO" />);
    const badge = screen.getByRole('img', { name: 'Party: KO' });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('KO');
  });

  it('applies real-world party branding colours from the token source', () => {
    render(<Badge variant="party" party="PiS" />);
    const badge = screen.getByRole('img', { name: 'Party: PiS' });
    // jsdom normalises the hex to rgb; assert the mapped values are applied.
    expect(badge).toHaveStyle({ backgroundColor: partyColor.PiS.bg });
    expect(badge).toHaveStyle({ color: partyColor.PiS.text });
  });

  it('supports the large size variant', () => {
    render(
      <Badge variant="status" size="lg">
        Passed
      </Badge>,
    );
    expect(screen.getByText('Passed')).toHaveClass('h-6');
  });
});
