import { cn } from '@/lib/utils';
import { platformTone } from '@/lib/design/platformTone';

const TONE_BG = {
  blue: 'bg-tint-blue',
  slate: 'bg-tint-slate',
} as const;

export function PlatformBadge({ platform, size = 'md' }: { platform: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 border-outline font-bold text-tint-foreground',
        size === 'sm' ? 'size-7 text-xs' : 'size-10 text-sm',
        TONE_BG[platformTone(platform)]
      )}
    >
      {platform.slice(0, 1).toUpperCase()}
    </span>
  );
}
