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
          success: '!bg-pop-mint !text-pop-foreground !border-pop-foreground',
          error: '!bg-pop-coral !text-pop-foreground !border-pop-foreground',
          info: '!bg-pop-sky !text-pop-foreground !border-pop-foreground',
          warning: '!bg-pop-sun !text-pop-foreground !border-pop-foreground',
          description: 'text-xs font-medium opacity-80',
          actionButton: 'ml-auto rounded-lg border-2 border-current px-2.5 py-1 text-xs font-bold',
        },
      }}
    />
  );
}
