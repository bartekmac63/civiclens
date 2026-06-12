/** Pure helpers for the §3.3 BlocGraph — kept separate so they are testable. */
import type { APIBlocEdge, APIBlocNode } from '@/api/types';

/** §3.3 — node radius scales with defection score: 6px min, 18px max. */
export function nodeRadius(defectionScore: number | null): number {
  if (defectionScore === null) return 6;
  const clamped = Math.min(1, Math.max(0, defectionScore));
  return 6 + clamped * 12;
}

/** §3.3 — edge opacity scales with similarity, 0.1–0.8. */
export function edgeOpacity(similarity: number): number {
  const clamped = Math.min(1, Math.max(0, similarity));
  return 0.1 + clamped * 0.7;
}

/** Edges visible at the current threshold, both endpoints present. */
export function filterEdges(
  edges: APIBlocEdge[],
  visibleIds: ReadonlySet<number>,
  threshold: number,
): APIBlocEdge[] {
  return edges.filter(
    (e) =>
      e.similarity >= threshold && visibleIds.has(e.a) && visibleIds.has(e.b),
  );
}

/** §3.3 — the SVG's spoken description, updated with the filtered state. */
export function graphAriaLabel(
  nodeCount: number,
  edgeCount: number,
  threshold: number,
): string {
  const pct = Math.round(threshold * 100);
  return (
    `Force graph of ${nodeCount} MPs connected by voting similarity. ` +
    `${edgeCount} connections above ${pct}% threshold.`
  );
}

/** Clubs present among the nodes, alphabetical, for the party filter. */
export function clubsOf(nodes: APIBlocNode[]): string[] {
  return [...new Set(nodes.map((n) => n.club ?? 'No club'))].sort();
}
