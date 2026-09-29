'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="pop-overlay fixed inset-0 z-[90] bg-[color:var(--overlay-scrim)]" />
      <DialogPrimitive.Content
        className={cn(
          'pop-dialog fixed left-1/2 top-1/2 z-[91] w-[min(100%_-_2rem,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-outline bg-card p-6 text-foreground shadow-hard-lg outline-none',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-lg border-2 border-transparent text-muted-foreground hover:border-outline hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('pr-10 font-display text-xl font-bold tracking-tight', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('mt-1.5 text-sm text-muted-foreground', className)} {...props} />;
}
