import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'pop' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon';

/** Sticker press: lift on hover, sink into the hard shadow on press. */
const PRESS =
  'border-2 border-outline shadow-hard-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transform-none';

const variantClasses: Record<Variant, string> = {
  default: cn('bg-primary text-primary-foreground hover:bg-primary-hover', PRESS),
  pop: cn('bg-pop-lime text-pop-foreground', PRESS),
  outline: cn('bg-card text-foreground hover:bg-card-muted', PRESS),
  ghost: 'border-2 border-transparent bg-transparent text-foreground hover:bg-card-muted',
  danger: cn('bg-destructive-fill text-destructive-fill-foreground', PRESS),
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
  'icon-sm': 'size-8',
  icon: 'size-10',
};

export function buttonVariants({
  variant = 'default',
  size = 'md',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-semibold transition-[transform,box-shadow,background-color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
