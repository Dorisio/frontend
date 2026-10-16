import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps): JSX.Element {
  return (
    <Card
      className={cn('flex flex-col items-center justify-center p-8 text-center border-dashed', className)}
      data-testid="empty-state"
      role="status"
      {...props}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="font-semibold text-base mb-1 text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </Card>
  );
}
