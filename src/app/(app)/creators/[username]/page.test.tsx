import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreatorProfilePage from './page';

const getCreatorProfile = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ username: 'creator-one' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('dorisio-sdk/react', () => ({
  useDorisio: () => ({ client: { getCreatorProfile } }),
}));

vi.mock('@/hooks/use-creator-balance', () => ({
  useCreatorBalance: () => ({ balance: null, loading: false, error: null }),
}));

vi.mock('@/hooks/use-transaction-history', () => ({
  useTransactionHistory: () => ({ transactions: [], total: 0, pageSize: 10, page: 1, loading: false }),
}));

vi.mock('@/components/sections/dorisio-button', () => ({
  default: () => <button type="button">Send a Tip</button>,
}));

describe('CreatorProfilePage', () => {
  const creator = {
    id: 'creator-1',
    userId: 'user-1',
    username: 'creator-one',
    displayName: 'Creator One',
    bio: 'A helpful creator',
    verified: true,
    isPublic: true,
    totalEarnings: 100,
    pendingBalance: 20,
    createdAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the loading state while the profile request is pending', () => {
    getCreatorProfile.mockReturnValue(new Promise(() => undefined));

    render(<CreatorProfilePage />);

    expect(screen.getByRole('status', { name: 'Loading creator profile' })).toBeInTheDocument();
  });

  it('shows a not-found error when profile loading fails', async () => {
    getCreatorProfile.mockRejectedValue(new Error('Profile unavailable'));

    render(<CreatorProfilePage />);

    expect(await screen.findByRole('heading', { name: 'Creator Not Found' })).toBeInTheDocument();
    expect(screen.getByText('Profile unavailable')).toBeInTheDocument();
  });

  it('renders profile data after loading succeeds', async () => {
    getCreatorProfile.mockResolvedValue(creator);

    render(<CreatorProfilePage />);

    expect(await screen.findByRole('heading', { name: 'Creator One' })).toBeInTheDocument();
    expect(screen.getByText('@creator-one')).toBeInTheDocument();
    expect(screen.getByText('A helpful creator')).toBeInTheDocument();
    await waitFor(() => expect(getCreatorProfile).toHaveBeenCalledWith('creator-one'));
  });
});
