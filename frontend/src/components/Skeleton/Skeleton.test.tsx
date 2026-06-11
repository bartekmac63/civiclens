import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton (§2.9)', () => {
  it('is decorative (aria-hidden) so screen readers skip it', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('matches the dimensions it is given, coercing numbers to px', () => {
    const { container } = render(<Skeleton width={120} height={32} />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: '120px', height: '32px' });
  });

  it('accepts string dimensions verbatim', () => {
    const { container } = render(<Skeleton width="50%" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: '50%' });
  });

  it('maps the radius token to the matching utility', () => {
    const { container } = render(<Skeleton radius="full" />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });
});
