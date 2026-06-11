import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DefectionScore } from './DefectionScore';

describe('DefectionScore (§2.6)', () => {
  it('is a meter with the score as its value and label', () => {
    render(<DefectionScore score={0.74} />);
    const meter = screen.getByRole('meter', { name: 'Defection score: 0.74' });
    expect(meter).toHaveAttribute('aria-valuenow', '0.74');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '1');
  });

  it('shows the numeric label to two decimals', () => {
    render(<DefectionScore score={0.5} />);
    expect(screen.getByText('0.50')).toBeInTheDocument();
  });

  it('flags high scores with the anomaly colour', () => {
    const { container } = render(<DefectionScore score={0.8} showLabel={false} />);
    expect(container.querySelector('.bg-anomaly')).toBeInTheDocument();
  });

  it('uses the normal (abstain) colour for low scores', () => {
    const { container } = render(<DefectionScore score={0.1} showLabel={false} />);
    expect(container.querySelector('.bg-abstain')).toBeInTheDocument();
  });

  it('clamps out-of-range scores', () => {
    render(<DefectionScore score={1.5} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '1');
  });
});
