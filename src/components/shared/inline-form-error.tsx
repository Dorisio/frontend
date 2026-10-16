import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InlineFormErrorProps {
  id: string;
  message?: string;
  className?: string;
}

export function InlineFormError({ id, message, className }: InlineFormErrorProps): JSX.Element | null {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn('flex items-center gap-1.5 text-xs text-destructive mt-1.5', className)}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
