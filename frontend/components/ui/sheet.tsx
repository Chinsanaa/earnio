'use client';

import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';

/** Bottom sheet (Vaul) for mobile flows such as payouts and filters. */
export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetClose = Drawer.Close;
export const SheetTitle = Drawer.Title;
export const SheetDescription = Drawer.Description;

export function SheetContent({ className, children, ...props }: React.ComponentProps<typeof Drawer.Content>) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-[90] bg-[color:var(--overlay-scrim)]" />
      <Drawer.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-[91] mt-24 flex max-h-[92dvh] flex-col rounded-t-3xl border-2 border-b-0 border-outline bg-card text-foreground outline-none',
          className
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[color:var(--border-strong)]" />
        <div className="overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}
