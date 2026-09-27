import { describe, expect, it } from 'vitest';
import { POP_TONES, popToneFor } from './popTone';

describe('popToneFor', () => {
  it('is stable for the same key', () => {
    expect(popToneFor('s1')).toBe(popToneFor('s1'));
  });

  it('always returns a known tone', () => {
    for (const key of ['', 'a', 'abc-123', '9f21013e-9596-4208']) {
      expect(POP_TONES).toContain(popToneFor(key));
    }
  });

  it('spreads different keys across several tones', () => {
    const tones = new Set(['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'].map(popToneFor));
    expect(tones.size).toBeGreaterThan(2);
  });
});
