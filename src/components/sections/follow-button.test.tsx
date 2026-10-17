import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FollowButton } from './follow-button';
import { CREATOR_FOLLOWS_KEY } from '@/hooks/use-creator-follow';

const request = vi.fn();

vi.mock('dorisio-sdk/react', () => ({
  useDorisio: () => ({ client: { request } }),
}));

describe('FollowButton', () => {
  beforeEach(() => {
    request.mockReset();
    window.localStorage.clear();
    request.mockImplementation(async (method: string) => {
      if (method === 'GET') return { success: true, data: { following: false, followerCount: 10 } };
      if (method === 'POST') return { success: true, data: { following: true, followerCount: 11 } };
      return { success: true, data: { following: false, followerCount: 10 } };
    });
  });

  it('shows the follow state and count from the API', async () => {
    render(<FollowButton creatorId="c1" followerId="u1" />);
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('follower-count')).toHaveTextContent('10 followers')
    );
    expect(request).toHaveBeenCalledWith('GET', '/creators/c1/follow');
  });

  it('follows, flips to Unfollow, and updates the count', async () => {
    const user = userEvent.setup();
    render(<FollowButton creatorId="c1" followerId="u1" />);
    await waitFor(() => expect(screen.getByTestId('follower-count')).toHaveTextContent('10'));

    await user.click(screen.getByRole('button', { name: 'Follow' }));

    expect(await screen.findByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('POST', '/creators/c1/follow');
    expect(screen.getByTestId('follower-count')).toHaveTextContent('11 followers');
  });

  it('unfollows and decrements the count', async () => {
    const user = userEvent.setup();
    request.mockImplementation(async (method: string) =>
      method === 'GET'
        ? { success: true, data: { following: true, followerCount: 5 } }
        : { success: true, data: { following: false, followerCount: 4 } }
    );
    render(<FollowButton creatorId="c1" followerId="u1" />);

    await user.click(await screen.findByRole('button', { name: 'Unfollow' }));

    expect(await screen.findByRole('button', { name: 'Follow' })).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('DELETE', '/creators/c1/follow');
    expect(screen.getByTestId('follower-count')).toHaveTextContent('4 followers');
  });

  it('persists across reloads even before the API answers', async () => {
    const user = userEvent.setup();
    const first = render(<FollowButton creatorId="c1" followerId="u1" />);
    await user.click(await screen.findByRole('button', { name: 'Follow' }));
    await screen.findByRole('button', { name: 'Unfollow' });
    expect(JSON.parse(window.localStorage.getItem(CREATOR_FOLLOWS_KEY)!)['u1:c1']).toEqual({
      following: true,
      followerCount: 11,
    });
    first.unmount();

    request.mockImplementation(() => new Promise(() => undefined)); // API never answers
    render(<FollowButton creatorId="c1" followerId="u1" />);
    expect(await screen.findByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
    expect(screen.getByTestId('follower-count')).toHaveTextContent('11 followers');
  });

  it('rolls back and shows an error when the API fails', async () => {
    const user = userEvent.setup();
    request.mockImplementation(async (method: string) => {
      if (method === 'GET') return { success: true, data: { following: false, followerCount: 10 } };
      throw new Error('network down');
    });
    render(<FollowButton creatorId="c1" followerId="u1" />);
    await waitFor(() => expect(screen.getByTestId('follower-count')).toHaveTextContent('10'));

    await user.click(screen.getByRole('button', { name: 'Follow' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
    expect(screen.getByTestId('follower-count')).toHaveTextContent('10 followers');
  });

  it('is disabled when signed out', () => {
    render(<FollowButton creatorId="c1" followerId={null} />);
    expect(screen.getByRole('button', { name: 'Follow' })).toBeDisabled();
  });
});
