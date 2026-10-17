/**
 * Skeleton
 * Loading placeholder
 */

import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps): JSX.Element {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

/**
 * Skeleton Card
 */
export function SkeletonCard(): JSX.Element {
  return (
    <div className="space-y-4 rounded-lg border border-border p-6">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Skeleton Text
 */
export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function SkeletonText({ lines = 3, ...props }: SkeletonTextProps): JSX.Element {
  return (
    <div className="space-y-2" {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 && 'w-4/5')} />
      ))}
    </div>
  );
}

/**
 * Skeleton Grid
 */
export interface SkeletonGridProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  cols?: number;
}

export function SkeletonGrid({ count = 6, cols = 3, ...props }: SkeletonGridProps): JSX.Element {
  return (
    <div className={`grid grid-cols-${cols} gap-6`} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton List Item
 * Reusable placeholder for avatar/icon + multi-line list rows
 */
export interface SkeletonListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  hasAvatar?: boolean;
}

export function SkeletonListItem({
  hasAvatar = true,
  className,
  ...props
}: SkeletonListItemProps): JSX.Element {
  return (
    <div
      className={cn('flex items-center gap-4 p-4 rounded-lg border border-border bg-card', className)}
      {...props}
    >
      {hasAvatar && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}

export function SkeletonList({
  count = 4,
  ...props
}: { count?: number } & SkeletonListItemProps): JSX.Element {
  return (
    <div className="space-y-3" role="status" aria-label="Loading items">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} {...props} />
      ))}
    </div>
  );
}
