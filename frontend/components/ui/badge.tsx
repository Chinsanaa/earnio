import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { Tint } from '@/lib/design/tint';

const toneClasses: Record<Tint | 'neutral', string> = {
  neutral: 'border-border-strong bg-card-muted text-foreground',
  blue: 'border-outline bg-tint-blue text-tint-foreground',
  slate: 'border-outline bg-tint-slate text-tint-foreground',
  green: 'border-outline bg-tint-green text-tint-foreground',
  red: 'border-outline bg-tint-red text-tint-foreground',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tint | 'neutral';
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
