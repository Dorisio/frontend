import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreatorVerificationBadge } from './creator-verification-badge';

describe('CreatorVerificationBadge', () => {
  it('renders a verified badge with its meaning and verification details', () => {
    render(
      <CreatorVerificationBadge
        verified
        verifiedAt="2026-01-15T00:00:00.000Z"
        verificationType="identity"
        showDetails
      />
    );

    expect(screen.getByRole('status', { name: 'Verified status' })).toBeInTheDocument();
    expect(screen.getByTitle(/identity verification/i)).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('identity')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
  });

  it('renders pending and rejected states without presenting them as verified', () => {
    const { rerender } = render(
      <CreatorVerificationBadge verified={false} status="pending" />
    );

    expect(screen.getByRole('status', { name: 'Verification pending status' })).toBeInTheDocument();
    expect(screen.getByTitle(/under review/i)).toBeInTheDocument();

    rerender(<CreatorVerificationBadge verified={false} status="rejected" />);

    expect(screen.getByRole('status', { name: 'Verification rejected status' })).toBeInTheDocument();
    expect(screen.getByTitle(/not approved/i)).toBeInTheDocument();
  });

  it('hides unverified creators by default and can show that state in the dashboard', () => {
    const { rerender } = render(<CreatorVerificationBadge verified={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(<CreatorVerificationBadge verified={false} showUnverified />);

    expect(screen.getByRole('status', { name: 'Not verified status' })).toBeInTheDocument();
  });
});
