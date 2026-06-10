import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the CivicLens heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /parliamentary intelligence/i }),
    ).toBeInTheDocument();
  });

  it('shows the 460-member stat', () => {
    render(<App />);
    expect(screen.getByText('460')).toBeInTheDocument();
  });
});
