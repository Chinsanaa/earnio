import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, buttonVariants } from './button';

describe('Button', () => {
  it('renders the default variant as a sticker (outline + hard shadow + press)', () => {
    render(<Button>Withdraw</Button>);
    const btn = screen.getByRole('button', { name: 'Withdraw' });
    expect(btn.className).toContain('bg-primary');
    expect(btn.className).toContain('border-outline');
    expect(btn.className).toContain('shadow-hard-sm');
    expect(btn.className).toContain('active:shadow-none');
  });

  it('supports the pop and danger variants', () => {
    expect(buttonVariants({ variant: 'pop' })).toContain('bg-pop-lime');
    expect(buttonVariants({ variant: 'danger' })).toContain('bg-destructive-fill');
  });

  it('ghost has no hard shadow', () => {
    expect(buttonVariants({ variant: 'ghost' })).not.toContain('shadow-hard');
  });

  it('merges caller classes last', () => {
    expect(buttonVariants({ className: 'w-full' })).toMatch(/w-full$/);
  });
});
