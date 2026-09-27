'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CommandItem } from './CommandPaletteDialog';

const CommandPaletteDialog = dynamic(() => import('./CommandPaletteDialog'), { ssr: false });

export type { CommandItem };

/** Topbar trigger + global Cmd/Ctrl+K shortcut for the command palette. */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  // Mount the lazily-loaded dialog on first use only, then keep it for fast reopen.
  const [mounted, setMounted] = useState(false);
  const [shortcut, setShortcut] = useState('⌘K');

  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) setShortcut('Ctrl K');
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMounted(true);
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className="creator-command-trigger"
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        aria-label={t('command_search')}
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search className="size-4" aria-hidden />
        <span className="creator-command-trigger-label">{t('command_search')}</span>
        <kbd className="creator-command-trigger-kbd">{shortcut}</kbd>
      </button>
      {mounted ? <CommandPaletteDialog open={open} onOpenChange={setOpen} items={items} /> : null}
    </>
  );
}
