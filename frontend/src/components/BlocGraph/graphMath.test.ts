import { describe, it, expect } from 'vitest';
import {
  clubsOf,
  edgeOpacity,
  filterEdges,
  graphAriaLabel,
  nodeRadius,
} from './graphMath';

describe('BlocGraph maths (§3.3)', () => {
  it('scales node radius 6–18px by defection score, 6 for unknown', () => {
    expect(nodeRadius(0)).toBe(6);
    expect(nodeRadius(1)).toBe(18);
    expect(nodeRadius(0.5)).toBe(12);
    expect(nodeRadius(null)).toBe(6);
    expect(nodeRadius(2)).toBe(18); // clamped
  });

  it('scales edge opacity 0.1–0.8 by similarity', () => {
    expect(edgeOpacity(0)).toBeCloseTo(0.1);
    expect(edgeOpacity(1)).toBeCloseTo(0.8);
    expect(edgeOpacity(0.5)).toBeCloseTo(0.45);
  });

  it('filters edges by threshold and visible endpoints', () => {
    const edges = [
      { a: 1, b: 2, similarity: 0.9 },
      { a: 1, b: 3, similarity: 0.7 }, // below threshold
      { a: 2, b: 4, similarity: 0.95 }, // endpoint 4 hidden
    ];
    const visible = new Set([1, 2, 3]);
    expect(filterEdges(edges, visible, 0.8)).toEqual([
      { a: 1, b: 2, similarity: 0.9 },
    ]);
  });

  it('describes the filtered graph for screen readers', () => {
    expect(graphAriaLabel(200, 47, 0.8)).toBe(
      'Force graph of 200 MPs connected by voting similarity. 47 connections above 80% threshold.',
    );
  });

  it('lists clubs alphabetically with a fallback for null', () => {
    const nodes = [
      { id: 1, firstName: 'A', lastName: 'A', club: 'PiS', defectionScore: 0 },
      { id: 2, firstName: 'B', lastName: 'B', club: 'KO', defectionScore: 0 },
      { id: 3, firstName: 'C', lastName: 'C', club: null, defectionScore: 0 },
    ];
    expect(clubsOf(nodes)).toEqual(['KO', 'No club', 'PiS']);
  });
});
