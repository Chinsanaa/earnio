import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { PopTone } from '@/lib/design/popTone';

const toneClasses: Record<PopTone | 'neutral', string> = {
  neutral: 'border-border-strong bg-card-muted text-foreground',
  lime: 'border-pop-foreground bg-pop-lime text-pop-foreground',
  sun: 'border-pop-foreground bg-pop-sun text-pop-foreground',
  coral: 'border-pop-foreground bg-pop-coral text-pop-foreground',
  lilac: 'border-pop-foreground bg-pop-lilac text-pop-foreground',
  mint: 'border-pop-foreground bg-pop-mint text-pop-foreground',
  sky: 'border-pop-foreground bg-pop-sky text-pop-foreground',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PopTone | 'neutral';
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-bold',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
