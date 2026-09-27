'use client';

import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex items-center gap-1 rounded-full border-2 border-outline bg-card p-1', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-pop-lime data-[state=active]:text-pop-foreground data-[state=active]:shadow-[inset_0_0_0_2px_var(--outline)]',
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
