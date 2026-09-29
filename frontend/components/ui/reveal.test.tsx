import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Reveal } from './reveal';

describe('Reveal', () => {
  it('renders children and becomes visible without IntersectionObserver', () => {
    // jsdom has no IntersectionObserver, which exercises the safe fallback.
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText('Hello')).toHaveClass('pop-reveal-visible');
  });
});
