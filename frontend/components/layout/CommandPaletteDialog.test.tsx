import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '@/contexts/LanguageContext';
import CommandPaletteDialog, { type CommandItem } from './CommandPaletteDialog';

beforeAll(() => {
  // cmdk relies on these browser APIs, which jsdom does not implement.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

function setup(items: CommandItem[]) {
  const onOpenChange = vi.fn();
  render(
    <LanguageProvider>
      <CommandPaletteDialog open onOpenChange={onOpenChange} items={items} />
    </LanguageProvider>
  );
  return { onOpenChange };
}

describe('CommandPaletteDialog', () => {
  it('filters items as the user types and runs the chosen one', async () => {
    const goWallet = vi.fn();
    const { onOpenChange } = setup([
      { id: '/dashboard', label: 'Home', group: 'pages', onSelect: vi.fn() },
      { id: 'request-payout', label: 'Request payout', group: 'actions', onSelect: goWallet },
    ]);

    await userEvent.type(screen.getByRole('combobox'), 'payout');
    expect(screen.queryByRole('option', { name: 'Home' })).not.toBeInTheDocument();

    await userEvent.keyboard('{Enter}');
    expect(goWallet).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows an empty state when nothing matches', async () => {
    setup([{ id: '/wallet', label: 'Wallet', group: 'pages', onSelect: vi.fn() }]);
    await userEvent.type(screen.getByRole('combobox'), 'zzzz');
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });
});
