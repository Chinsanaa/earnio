'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * App-wide toast host (Sonner), styled as Solid Pop stickers.
 * Call `toast.success(...)` / `toast.error(...)` from `sonner` anywhere.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={88}
      mobileOffset={88}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-xl border-2 border-outline bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-hard',
          success: '!bg-tint-green !text-tint-foreground !border-outline',
          error: '!bg-tint-red !text-tint-foreground !border-outline',
          info: '!bg-tint-blue !text-tint-foreground !border-outline',
          warning: '!bg-tint-slate !text-tint-foreground !border-outline',
          description: 'text-xs font-medium opacity-80',
          actionButton: 'ml-auto rounded-lg border-2 border-current px-2.5 py-1 text-xs font-bold',
        },
      }}
    />
  );
}
