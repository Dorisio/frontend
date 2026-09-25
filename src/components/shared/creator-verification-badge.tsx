import { BadgeCheck, CircleDashed, Clock, XCircle } from 'lucide-react';
import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';
import type { CreatorVerificationStatus } from '@/types';

export interface CreatorVerificationBadgeProps {
  verified: boolean;
  status?: CreatorVerificationStatus | string;
  verificationStatus?: CreatorVerificationStatus | string;
  verifiedAt?: string;
  verificationType?: string;
  verificationReason?: string;
  compact?: boolean;
  showDetails?: boolean;
  showUnverified?: boolean;
  className?: string;
}

function resolveVerificationStatus(
  verified: boolean,
  status?: CreatorVerificationStatus | string,
  verificationStatus?: CreatorVerificationStatus | string
): CreatorVerificationStatus {
  const value = status ?? verificationStatus;

  if (verified || value === 'verified' || value === 'approved') return 'verified';
  if (value === 'pending' || value === 'in_review' || value === 'in-review' || value === 'submitted') {
    return 'pending';
  }
  if (value === 'rejected' || value === 'denied' || value === 'failed') return 'rejected';
  return 'unverified';
}

function getStatusLabel(status: CreatorVerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'pending':
      return 'Verification pending';
    case 'rejected':
      return 'Verification rejected';
    case 'unverified':
      return 'Not verified';
  }
}

function getStatusMeaning(status: CreatorVerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'This creator has completed Dorisio identity verification.';
    case 'pending':
      return 'This creator’s identity verification is currently under review.';
    case 'rejected':
      return 'This creator’s identity verification request was not approved.';
    case 'unverified':
      return 'This creator has not completed identity verification.';
  }
}

function VerificationIcon({ status }: { status: CreatorVerificationStatus }): JSX.Element {
  const className = 'h-3.5 w-3.5 shrink-0';

  switch (status) {
    case 'verified':
      return <BadgeCheck className={className} aria-hidden="true" />;
    case 'pending':
      return <Clock className={className} aria-hidden="true" />;
    case 'rejected':
      return <XCircle className={className} aria-hidden="true" />;
    case 'unverified':
      return <CircleDashed className={className} aria-hidden="true" />;
  }
}

export function CreatorVerificationBadge({
  verified,
  status,
  verificationStatus,
  verifiedAt,
  verificationType,
  verificationReason,
  compact = false,
  showDetails = false,
  showUnverified = false,
  className,
}: CreatorVerificationBadgeProps): JSX.Element | null {
  const resolvedStatus = resolveVerificationStatus(verified, status, verificationStatus);

  if (resolvedStatus === 'unverified' && !showUnverified) return null;

  const label = getStatusLabel(resolvedStatus);
  const detailParts = [
    verifiedAt ? `Verified ${formatDate(verifiedAt)}` : null,
    verificationType ? `${verificationType} verification` : null,
  ].filter((part): part is string => Boolean(part));
  const tooltip = `${getStatusMeaning(resolvedStatus)}${detailParts.length ? ` ${detailParts.join(' · ')}.` : ''}`;
  const variant =
    resolvedStatus === 'verified'
      ? 'success'
      : resolvedStatus === 'pending'
        ? 'warning'
        : resolvedStatus === 'rejected'
          ? 'destructive'
          : 'outline';

  return (
    <span className={cn('group relative inline-flex flex-col', className)}>
      <span
        className={cn(badgeVariants({ variant }), 'cursor-help', compact && 'px-2 text-[11px]')}
        title={tooltip}
        role="status"
        aria-label={`${label} status`}
        tabIndex={0}
      >
        <VerificationIcon status={resolvedStatus} />
        <span>{label}</span>
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-max max-w-[16rem] rounded-md border bg-popover px-3 py-2 text-xs font-normal text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {tooltip}
      </span>
      {showDetails && (
        <span className="mt-2 block space-y-1 text-xs text-muted-foreground">
          <span className="block">
            <span className="font-medium text-foreground">Status:</span> {label}
          </span>
          {verifiedAt && (
            <span className="block">
              <span className="font-medium text-foreground">Verified:</span>{' '}
              <time dateTime={verifiedAt}>{formatDate(verifiedAt)}</time>
            </span>
          )}
          {verificationType && (
            <span className="block">
              <span className="font-medium text-foreground">Type:</span> {verificationType}
            </span>
          )}
          {verificationReason && (
            <span className="block">
              <span className="font-medium text-foreground">Reason:</span> {verificationReason}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
