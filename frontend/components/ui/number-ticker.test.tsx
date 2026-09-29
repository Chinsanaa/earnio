import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return { ...actual, useReducedMotion: () => true, useInView: () => true };
});

import { NumberTicker } from './number-ticker';

describe('NumberTicker', () => {
  it('shows the final value immediately when reduced motion is preferred', () => {
    render(<NumberTicker value={4850000} format={(n) => `MNT ${Math.round(n).toLocaleString('en-US')}`} />);
    expect(screen.getByLabelText('MNT 4,850,000')).toHaveTextContent('MNT 4,850,000');
  });
});
