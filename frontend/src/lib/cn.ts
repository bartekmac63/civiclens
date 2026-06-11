/**
 * Minimal className combiner: joins truthy class fragments with a space.
 * Keeps component markup readable without pulling in a dependency. Order is
 * preserved; later Tailwind utilities still win by CSS source order, so callers
 * should pass overrides last.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
