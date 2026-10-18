import { describe, expect, it } from 'vitest';
import { safeDeliverableHref } from './deliverable';

describe('safeDeliverableHref', () => {
  it('allows https links on supported platforms', () => {
    expect(safeDeliverableHref('https://www.tiktok.com/@demo/video/1')).toBe(
      'https://www.tiktok.com/@demo/video/1'
    );
    expect(safeDeliverableHref('https://youtu.be/abc')).toBe('https://youtu.be/abc');
    expect(safeDeliverableHref('https://www.instagram.com/reel/x/')).not.toBeNull();
  });

  it('rejects unsafe schemes, lookalike hosts and empty input', () => {
    expect(safeDeliverableHref('javascript:alert(1)')).toBeNull();
    expect(safeDeliverableHref('http://www.tiktok.com/x')).toBeNull();
    expect(safeDeliverableHref('https://tiktok.com.evil.example/x')).toBeNull();
    expect(safeDeliverableHref('')).toBeNull();
    expect(safeDeliverableHref(null)).toBeNull();
  });
});
