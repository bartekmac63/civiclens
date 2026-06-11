import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoteBar } from './VoteBar';

describe('VoteBar (§2.7)', () => {
  it('exposes the full breakdown as an accessible label', () => {
    render(<VoteBar yes={312} no={98} abstain={42} total={460} />);
    expect(
      screen.getByRole('img', { name: '312 yes, 98 no, 42 abstentions' }),
    ).toBeInTheDocument();
  });

  it('shows numeric labels by default (not colour alone)', () => {
    render(<VoteBar yes={312} no={98} abstain={42} total={460} />);
    expect(screen.getByText('Yes 312')).toBeInTheDocument();
    expect(screen.getByText('No 98')).toBeInTheDocument();
    expect(screen.getByText('Abs 42')).toBeInTheDocument();
  });

  it('hides the labels in compact mode but keeps the aria-label', () => {
    render(<VoteBar yes={1} no={2} abstain={3} total={6} compact />);
    expect(screen.queryByText('Yes 1')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      '1 yes, 2 no, 3 abstentions',
    );
  });

  it('sizes the yes segment proportionally to the total', () => {
    const { container } = render(
      <VoteBar yes={230} no={0} abstain={0} total={460} />,
    );
    const yesSegment = container.querySelector('.bg-positive') as HTMLElement;
    expect(yesSegment).toHaveStyle({ width: '50%' });
  });
});
