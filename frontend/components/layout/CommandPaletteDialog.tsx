'use client';

import { Command } from 'cmdk';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CommandItem {
  id: string;
  label: string;
  group: 'pages' | 'actions';
  icon?: React.ReactNode;
  keywords?: string[];
  onSelect: () => void;
}

/** The palette body. Loaded lazily by CommandPalette so cmdk stays out of the first bundle. */
export default function CommandPaletteDialog({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
}) {
  const { t } = useLanguage();
  const groups: Array<CommandItem['group']> = ['pages', 'actions'];

  function run(item: CommandItem) {
    onOpenChange(false);
    item.onSelect();
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="pop-overlay fixed inset-0 z-[90] bg-[color:var(--overlay-scrim)]" />
        <DialogPrimitive.Content
          className="pop-dialog fixed left-1/2 top-[12vh] z-[91] w-[min(100%_-_2rem,36rem)] -translate-x-1/2 overflow-hidden rounded-2xl border-2 border-outline bg-card text-foreground shadow-hard-lg outline-none"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{t('command_search')}</DialogPrimitive.Title>
          <Command loop label={t('command_search')}>
            <Command.Input
              autoFocus
              placeholder={t('command_placeholder')}
              className="h-14 w-full border-b-2 border-outline bg-transparent px-5 text-base font-medium text-foreground outline-none placeholder:text-muted focus-visible:outline-none"
            />
            <Command.List className="max-h-[min(60vh,24rem)] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                {t('command_no_results')}
              </Command.Empty>
              {groups.map((group) => {
                const groupItems = items.filter((i) => i.group === group);
                if (!groupItems.length) return null;
                return (
                  <Command.Group
                    key={group}
                    heading={t(group === 'pages' ? 'command_pages' : 'command_actions')}
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {groupItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.id}`}
                        keywords={item.keywords}
                        onSelect={() => run(item)}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-transparent px-3 text-sm font-semibold data-[selected=true]:border-outline data-[selected=true]:bg-tint-blue data-[selected=true]:text-tint-foreground"
                      >
                        <span className="flex size-5 items-center justify-center" aria-hidden>
                          {item.icon}
                        </span>
                        {item.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
