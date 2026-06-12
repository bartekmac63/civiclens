import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button (§2.1)', () => {
  it('renders as a native button with its label', () => {
    render(<Button variant="primary">Export data</Button>);
    const button = screen.getByRole('button', { name: 'Export data' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('uses the accent background only for the primary variant', () => {
    const { rerender } = render(<Button variant="primary">Go</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent');
    rerender(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole('button')).not.toHaveClass('bg-accent');
    rerender(<Button variant="ghost">Go</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
  });

  it('fires onClick on click and via the keyboard (Enter / Space)', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button variant="primary" onClick={onClick}>
        Filter
      </Button>,
    );
    const button = screen.getByRole('button');

    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('is disabled and unclickable in the disabled state', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button variant="primary" disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks loading with aria-busy and suppresses the click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button variant="primary" loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
