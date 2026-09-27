'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            'pop-dialog z-[95] max-w-64 rounded-lg border-2 border-outline bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background shadow-hard-sm',
            className
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
