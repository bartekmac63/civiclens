import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard (§2.4)', () => {
  it('renders the label and value as a labelled group', () => {
    render(<StatCard label="Total MPs" value={460} />);
    const group = screen.getByRole('group', { name: 'Total MPs: 460' });
    expect(group).toHaveTextContent('Total MPs');
    expect(group).toHaveTextContent('460');
  });

  it('shows a skeleton and marks itself busy while loading', () => {
    const { container } = render(
      <StatCard label="Total MPs" value={460} loading />,
    );
    expect(screen.queryByText('460')).not.toBeInTheDocument();
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).toBeInTheDocument();
  });

  it('renders the value in the anomaly colour when flagged', () => {
    render(<StatCard label="Anomalies" value={3} accentOnAnomaly />);
    expect(screen.getByText('3')).toHaveClass('text-anomaly');
  });

  it('describes a positive delta with direction for screen readers', () => {
    render(<StatCard label="Bills" value={120} delta={4.2} />);
    const delta = screen.getByText('%', { exact: false });
    expect(delta).toHaveClass('text-positive');
    expect(delta).toHaveAttribute('aria-label', 'up 4.2 percent');
  });

  it('uses the negative colour for a negative delta', () => {
    render(<StatCard label="Bills" value={120} delta={-2.1} />);
    expect(screen.getByText('%', { exact: false })).toHaveClass('text-negative');
  });
});
