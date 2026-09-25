import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet as sdkUseWallet } from 'dorisio-sdk/react';
import type { Wallet } from 'dorisio-sdk';
import { mapWalletError, useWallet } from './use-wallet';

const mockGenerateNonce = vi.fn();
const mockGetChallenge = vi.fn();
const mockVerifyWallet = vi.fn();
const mockListWallets = vi.fn();
const mockSelectWallet = vi.fn();
const mockUnlinkWallet = vi.fn();
const mockRenameWallet = vi.fn();
const mockGetBalance = vi.fn();
const mockReset = vi.fn();

vi.mock('dorisio-sdk/react', () => ({
  useWallet: vi.fn(),
}));

type SDKWalletResult = ReturnType<typeof sdkUseWallet>;

function buildSDKResult(overrides: Partial<SDKWalletResult> = {}): SDKWalletResult {
  const wallet = {
    id: '1',
    userId: 'user-1',
    publicKey: 'test-key-1',
    name: 'My Wallet',
    verified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  return {
    wallets: [wallet],
    selectedWallet: wallet,
    loading: false,
    error: undefined,
    challengeStep: 'idle',
    generateNonce: mockGenerateNonce,
    getChallenge: mockGetChallenge,
    verifyWallet: mockVerifyWallet,
    listWallets: mockListWallets,
    selectWallet: mockSelectWallet,
    unlinkWallet: mockUnlinkWallet,
    renameWallet: mockRenameWallet,
    getBalance: mockGetBalance,
    reset: mockReset,
    ...overrides,
  } as SDKWalletResult;
}

function makeSdkError(message: string, code?: string): Error {
  const error = new Error(message) as Error & { code?: string };
  if (code) error.code = code;
  return error;
}

describe('mapWalletError', () => {
  it('returns friendly message for WALLET_NOT_FOUND', () => {
    expect(mapWalletError(makeSdkError('not found', 'WALLET_NOT_FOUND'))).toBe(
      'Wallet not found. It may have already been removed.'
    );
  });

  it('returns friendly message for WALLET_ALREADY_LINKED', () => {
    expect(mapWalletError(makeSdkError('duplicate', 'WALLET_ALREADY_LINKED'))).toBe(
      'This wallet is already linked to your account.'
    );
  });

  it('returns friendly message for INVALID_SIGNATURE', () => {
    expect(mapWalletError(makeSdkError('bad sig', 'INVALID_SIGNATURE'))).toBe(
      'Wallet verification failed: the signature is invalid. Please try again.'
    );
  });

  it('returns friendly message for CHALLENGE_EXPIRED', () => {
    expect(mapWalletError(makeSdkError('expired', 'CHALLENGE_EXPIRED'))).toBe(
      'Verification challenge expired. Please start the verification process again.'
    );
  });

  it('returns friendly message for UNAUTHORIZED', () => {
    expect(mapWalletError(makeSdkError('unauth', 'UNAUTHORIZED'))).toBe(
      'Your session has expired. Please log in again.'
    );
  });

  it('returns friendly message for RATE_LIMITED', () => {
    expect(mapWalletError(makeSdkError('slow down', 'RATE_LIMITED'))).toBe(
      'Too many requests. Please wait a moment and try again.'
    );
  });

  it('returns friendly message for NETWORK_ERROR', () => {
    expect(mapWalletError(makeSdkError('network', 'NETWORK_ERROR'))).toBe(
      'Network error. Please check your connection and try again.'
    );
  });

  it('returns friendly message for TIMEOUT', () => {
    expect(mapWalletError(makeSdkError('timed out', 'TIMEOUT'))).toBe(
      'The request timed out. Please try again.'
    );
  });

  it('returns friendly message for BLOCKCHAIN_TIMEOUT', () => {
    expect(mapWalletError(makeSdkError('chain', 'BLOCKCHAIN_TIMEOUT'))).toContain(
      'Blockchain confirmation timed out'
    );
  });

  it('falls back to error message text for unknown codes', () => {
    expect(mapWalletError(makeSdkError('Something went wrong', 'UNKNOWN_CODE'))).toBe(
      'Something went wrong'
    );
  });

  it('returns generic message for non-Error values', () => {
    expect(mapWalletError('plain string')).toBe(
      'An unexpected error occurred. Please try again.'
    );
    expect(mapWalletError(null)).toBe('An unexpected error occurred. Please try again.');
  });

  it('detects network issues from message text when no code is set', () => {
    expect(mapWalletError(new Error('network timeout occurred'))).toMatch(/network|timeout/i);
  });
});

describe('useWallet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult());
  });

  it('returns wallet list', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.wallets).toHaveLength(1);
    expect(result.current.wallets[0].publicKey).toBe('test-key-1');
    expect(result.current.wallets[0].verified).toBe(true);
  });

  it('returns selected wallet', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.selectedWallet?.id).toBe('1');
    expect(result.current.selectedWallet?.name).toBe('My Wallet');
  });

  it('handles loading state', () => {
    vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ wallets: [], loading: true }));

    const { result } = renderHook(() => useWallet());

    expect(result.current.loading).toBe(true);
  });

  it('handles error state', () => {
    vi.mocked(sdkUseWallet).mockReturnValue(
      buildSDKResult({ wallets: [], error: 'Failed to load wallets' })
    );

    const { result } = renderHook(() => useWallet());

    expect(result.current.error).toBe('Failed to load wallets');
  });

  it('maps wallets correctly from SDK format', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.wallets[0]).toMatchObject({
      id: expect.any(String),
      publicKey: expect.any(String),
      verified: expect.any(Boolean),
    });
  });

  it('handles wallet with no name', () => {
    vi.mocked(sdkUseWallet).mockReturnValue(
      buildSDKResult({
        wallets: [
          {
            id: '2',
            userId: 'user-1',
            publicKey: 'test-key-2',
            name: null,
            verified: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );

    const { result } = renderHook(() => useWallet());

    expect(result.current.wallets[0].name).toBeUndefined();
    expect(result.current.wallets[0].verified).toBe(false);
  });

  it('provides wallet actions', () => {
    const { result } = renderHook(() => useWallet());

    expect(typeof result.current.selectWallet).toBe('function');
    expect(typeof result.current.disconnectWallet).toBe('function');
    expect(typeof result.current.generateNonce).toBe('function');
    expect(typeof result.current.getChallenge).toBe('function');
    expect(typeof result.current.verifyWallet).toBe('function');
    expect(typeof result.current.renameWallet).toBe('function');
    expect(typeof result.current.getBalance).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  describe('optimistic wallet operations', () => {
    it('disconnectWallet removes the wallet immediately, before the SDK call resolves', async () => {
      let resolveUnlink!: () => void;
      const unlinkWallet = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveUnlink = resolve;
          })
      );
      vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ unlinkWallet }));

      const { result } = renderHook(() => useWallet());
      expect(result.current.wallets).toHaveLength(1);

      let disconnectPromise!: Promise<void>;
      act(() => {
        disconnectPromise = result.current.disconnectWallet('1');
      });

      expect(result.current.wallets).toHaveLength(0);
      expect(result.current.isPending('1')).toBe(true);

      resolveUnlink();
      await act(async () => {
        await disconnectPromise;
      });

      expect(result.current.isPending('1')).toBe(false);
      expect(unlinkWallet).toHaveBeenCalledWith('1');
    });

    it('rolls back and surfaces a retryable error when disconnectWallet fails', async () => {
      const unlinkWallet = vi.fn().mockRejectedValue(new Error('network down'));
      vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ unlinkWallet }));

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await expect(result.current.disconnectWallet('1')).rejects.toThrow('network down');
      });

      expect(result.current.wallets).toHaveLength(1);
      expect(result.current.isPending('1')).toBe(false);
      expect(result.current.actionError).toEqual({ walletId: '1', message: 'network down' });
    });

    it('renameWallet shows the new name immediately, before the SDK call resolves', async () => {
      let resolveRename!: (wallet: Wallet) => void;
      const renameWallet = vi.fn(
        () =>
          new Promise<Wallet>((resolve) => {
            resolveRename = resolve;
          })
      );
      vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ renameWallet }));

      const { result } = renderHook(() => useWallet());

      let renamePromise!: Promise<void>;
      act(() => {
        renamePromise = result.current.renameWallet('1', 'Renamed Wallet');
      });

      expect(result.current.wallets[0].name).toBe('Renamed Wallet');
      expect(result.current.isPending('1')).toBe(true);

      resolveRename({
        id: '1',
        userId: 'user-1',
        publicKey: 'test-key-1',
        name: 'Renamed Wallet',
        verified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      await act(async () => {
        await renamePromise;
      });

      expect(result.current.isPending('1')).toBe(false);
      expect(renameWallet).toHaveBeenCalledWith('1', 'Renamed Wallet');
    });

    it('rolls back to the previous name and surfaces a retryable error when renameWallet fails', async () => {
      const renameWallet = vi.fn().mockRejectedValue(new Error('name already taken'));
      vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ renameWallet }));

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await expect(result.current.renameWallet('1', 'Renamed Wallet')).rejects.toThrow(
          'name already taken'
        );
      });

      expect(result.current.wallets[0].name).toBe('My Wallet');
      expect(result.current.isPending('1')).toBe(false);
      expect(result.current.actionError).toEqual({
        walletId: '1',
        message: 'name already taken',
      });
    });

    it('isPending prevents double-submission for the duration of an action', async () => {
      let resolveUnlink!: () => void;
      const unlinkWallet = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveUnlink = resolve;
          })
      );
      vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ unlinkWallet }));

      const { result } = renderHook(() => useWallet());
      expect(result.current.isPending('1')).toBe(false);

      let disconnectPromise!: Promise<void>;
      act(() => {
        disconnectPromise = result.current.disconnectWallet('1');
      });
      expect(result.current.isPending('1')).toBe(true);

      resolveUnlink();
      await act(async () => {
        await disconnectPromise;
      });
      expect(result.current.isPending('1')).toBe(false);
    });

    it('retryAction reruns the failed disconnect and clears the previous error', async () => {
      const unlinkWallet = vi
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce(undefined);
      vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ unlinkWallet }));

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await expect(result.current.disconnectWallet('1')).rejects.toThrow('timeout');
      });
      expect(result.current.actionError?.message).toBe('timeout');

      await act(async () => {
        await result.current.retryAction('1');
      });

      expect(result.current.actionError).toBeNull();
      expect(unlinkWallet).toHaveBeenCalledTimes(2);
    });

    it('clearActionError resets the error without retrying', async () => {
      const unlinkWallet = vi.fn().mockRejectedValue(new Error('offline'));
      vi.mocked(sdkUseWallet).mockReturnValue(buildSDKResult({ unlinkWallet }));

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await expect(result.current.disconnectWallet('1')).rejects.toThrow('offline');
      });
      expect(result.current.actionError).not.toBeNull();

      act(() => {
        result.current.clearActionError();
      });

      expect(result.current.actionError).toBeNull();
      expect(unlinkWallet).toHaveBeenCalledTimes(1);
    });
  });
});
