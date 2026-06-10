import { describe, it, expect } from 'vitest';
import { tokens, color, partyColor, fontSize } from './tokens';

describe('design tokens (§1)', () => {
  it('uses Polish-flag red as the single accent', () => {
    expect(color.accent.DEFAULT).toBe('#DC143C');
  });

  it('defines the full 8-step type scale', () => {
    expect(Object.keys(fontSize)).toHaveLength(8);
    expect(fontSize.base).toBe('0.875rem');
  });

  it('carries light and dark values for surface colours', () => {
    expect(color.bg.primary.light).toBe('#FFFFFF');
    expect(color.bg.primary.dark).toBe('#0F0F0F');
  });

  it('exposes the six 10th-term party colours', () => {
    expect(Object.keys(partyColor)).toHaveLength(6);
    expect(partyColor.KO.bg).toBe('#F5A623');
  });

  it('bundles every token group under the default export', () => {
    expect(tokens.color).toBeDefined();
    expect(tokens.space[4]).toBe(16);
    expect(tokens.radius.md).toBe(8);
  });
});
