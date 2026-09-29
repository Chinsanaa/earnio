import { describe, expect, it } from 'vitest';
import { DECORATIVE_TINTS, tintFor } from './tint';

describe('tintFor', () => {
  it('is stable for the same key', () => {
    expect(tintFor('s1')).toBe(tintFor('s1'));
  });

  it('only returns decorative tints, never status colors', () => {
    for (const key of ['', 'a', 'abc-123', '9f21013e-9596-4208', 's0', 's1', 's2', 's3']) {
      expect(DECORATIVE_TINTS).toContain(tintFor(key));
    }
  });

  it('uses both decorative tints across different keys', () => {
    const tints = new Set(['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'].map(tintFor));
    expect(tints.size).toBe(DECORATIVE_TINTS.length);
  });
});
