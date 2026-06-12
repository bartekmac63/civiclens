import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

// §2.1 — accent (Polish red) is used only for `primary`.
const VARIANT: Record<ButtonProps['variant'], string> = {
  primary: 'bg-accent text-accent-text hover:bg-accent-hover',
  secondary: 'bg-bg-tertiary text-text-primary hover:bg-bg-elevated',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg-secondary',
};

// §2.1 — sizes: heights 28 / 36 / 44px, x-padding 10 / 16 / 20px.
const SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-7 px-2.5 text-sm',
  md: 'h-9 px-4 text-base',
  lg: 'h-11 px-5 text-md',
};

export function Button({
  variant,
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
}: ButtonProps) {
  // §2.1 — loading is conveyed with aria, not the disabled attribute; disabled
  // uses the native attribute. Either state suppresses the click.
  const inactive = disabled || loading;

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={inactive ? undefined : onClick}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-base',
        'active:scale-98 disabled:cursor-not-allowed disabled:opacity-40',
        loading && 'cursor-progress',
        VARIANT[variant],
        SIZE[size],
      )}
    >
      {loading ? (
        <>
          <Spinner />
          {/* Preserve label width while loading (§2.1) without showing text. */}
          <span className="invisible">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Button;
