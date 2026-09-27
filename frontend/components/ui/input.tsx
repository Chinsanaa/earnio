import { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const FIELD =
  'w-full rounded-xl border-2 border-border-strong bg-card px-3.5 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:border-outline focus:shadow-hard-sm aria-[invalid=true]:border-destructive-fill disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD, 'min-h-11 py-2.5', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD, 'min-h-28 py-3', className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-semibold text-foreground', className)} {...props} />;
}

/** Inline validation message; pair with aria-describedby on the field. */
export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-destructive-text">
      {children}
    </p>
  );
}
