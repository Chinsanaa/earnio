import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Friendly placeholder for empty lists: solid icon tile, title, hint, optional action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border-2 border-dashed border-border-strong px-6 py-10 text-center',
        className
      )}
    >
      <span className="flex size-14 rotate-[-4deg] items-center justify-center rounded-2xl border-2 border-pop-foreground bg-pop-sun text-pop-foreground shadow-hard-sm">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
