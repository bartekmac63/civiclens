import { cn } from '@/lib/cn';
import { radius as radiusToken } from '@/tokens';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: keyof typeof radiusToken;
}

const RADIUS: Record<keyof typeof radiusToken, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const toCss = (v: string | number): string =>
  typeof v === 'number' ? `${v}px` : v;

/**
 * §2.9 — loading placeholder. Must match the dimensions of the content it
 * replaces; never use a spinner as a page-level loader. Decorative, so it is
 * aria-hidden; the loading parent carries aria-busy. The pulse animation is
 * neutralised by the global prefers-reduced-motion rule (index.css).
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'sm',
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-skeleton bg-bg-tertiary', RADIUS[radius])}
      style={{ width: toCss(width), height: toCss(height) }}
    />
  );
}

export default Skeleton;
