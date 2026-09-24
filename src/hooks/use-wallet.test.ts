import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet as sdkUseWallet } from 'dorisio-sdk/react';
import { useWallet } from './use-wallet';

// Mock the SDK hook. `sdkUseWallet` below is the mocked import itself
// (Vitest hoists this factory above the import statements, so it cannot
// reference a top-level helper declared after it; the default return
// value is inlined here instead), so
// `vi.mocked(sdkUseWallet).mockImplementation(...)` reconfigures it
// per-test without the `require()` + `vi.mocked(require(...))` pattern
// used elsewhere in this file, which does not intercept calls in this
// project's Vite/Vitest ESM setup (the mock factory's export is a frozen
// module-namespace binding under `require()`, not a mutable reference).
vi.mock('dorisio-sdk/react', () => ({
  useWallet: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildSDKReturn(overrides: Record<string, unknown> = {}) {
  return {
    wallets: [{ id: '1', publicKey: 'test-key-1', name: 'My Wallet', verified: true }],
    selectedWallet: { id: '1', publicKey: 'test-key-1', name: 'My Wallet', verified: true },
    loading: false,
    error: null,
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
  };
}

function makeSdkError(message: string, code?: string): Error {
  const err = new Error(message) as Error & { code?: string };
  if (code) err.code = code;
  return err;
}

function makeTransientError(code = 'NETWORK_ERROR'): Error {
  return makeSdkError('network failure', code);
}

// ---------------------------------------------------------------------------
// mapWalletError unit tests
// ---------------------------------------------------------------------------

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
    const err = makeSdkError('Something went wrong', 'UNKNOWN_CODE');
    expect(mapWalletError(err)).toBe('Something went wrong');
  });

  it('returns generic message for non-Error values', () => {
    expect(mapWalletError('plain string')).toBe(
      'An unexpected error occurred. Please try again.'
    );
    expect(mapWalletError(null)).toBe('An unexpected error occurred. Please try again.');
  });

  it('detects network issues from message text when no code is set', () => {
    const err = new Error('network timeout occurred');
    expect(mapWalletError(err)).toMatch(/network|timeout/i);
  });
});

// ---------------------------------------------------------------------------
// useWallet hook tests
// ---------------------------------------------------------------------------

// A test earlier in the file may call `.mockImplementation(...)` to return
// a different wallets/loading/error shape. `vi.clearAllMocks()` alone only
// clears call history, not a swapped-in implementation, so a later test
// would otherwise silently inherit whatever the previous test configured.
// Restoring this default before every test keeps each test's SDK response
// independent of run order.
function defaultSdkWalletResult() {
  return {
    wallets: [
      {
        id: '1',
        publicKey: 'test-key-1',
        name: 'My Wallet',
        verified: true,
      },
    ],
    selectedWallet: {
      id: '1',
      publicKey: 'test-key-1',
      name: 'My Wallet',
      verified: true,
    },
    loading: false,
    error: null,
    generateNonce: vi.fn(),
    getChallenge: vi.fn(),
    verifyWallet: vi.fn(),
    listWallets: vi.fn(),
    selectWallet: vi.fn(),
    unlinkWallet: vi.fn(),
    renameWallet: vi.fn(),
    getBalance: vi.fn(),
    reset: vi.fn(),
  };
}

describe('useWallet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    sdkUseWallet.mockReturnValue(buildSDKReturn());
  });

  // -------------------------------------------------------------------------
  // Basic shape
  // -------------------------------------------------------------------------
  it('returns wallet list', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.wallets).toHaveLength(1);
    expect(result.current.wallets[0].publicKey).toBe('test-key-1');
    expect(result.current.wallets[0].verified).toBe(true);
  });

  it('returns selected wallet', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.selectedWallet).not.toBeNull();
    expect(result.current.selectedWallet?.id).toBe('1');
    expect(result.current.selectedWallet?.name).toBe('My Wallet');
  });

  it('handles loading state', () => {
    vi.mocked(sdkUseWallet).mockImplementation(() => ({
      wallets: [],
      selectedWallet: null,
      loading: true,
      error: null,
      generateNonce: vi.fn(),
      getChallenge: vi.fn(),
      verifyWallet: vi.fn(),
      listWallets: vi.fn(),
      selectWallet: vi.fn(),
      unlinkWallet: vi.fn(),
      renameWallet: vi.fn(),
      getBalance: vi.fn(),
      reset: vi.fn(),
    }));

    const { result } = renderHook(() => useWallet());
    expect(result.current.loading).toBe(true);
  });

  it('handles error state', () => {
    vi.mocked(sdkUseWallet).mockImplementation(() => ({
      wallets: [],
      selectedWallet: null,
      loading: false,
      error: 'Failed to load wallets',
      generateNonce: vi.fn(),
      getChallenge: vi.fn(),
      verifyWallet: vi.fn(),
      listWallets: vi.fn(),
      selectWallet: vi.fn(),
      unlinkWallet: vi.fn(),
      renameWallet: vi.fn(),
      getBalance: vi.fn(),
      reset: vi.fn(),
    }));

    const { result } = renderHook(() => useWallet());
    expect(result.current.error).toBe('Failed to load wallets');
  });

  it('maps wallets correctly from SDK format', () => {
    const { result } = renderHook(() => useWallet());

    const wallet = result.current.wallets[0];
    expect(wallet).toMatchObject({
      id: expect.any(String),
      publicKey: expect.any(String),
      verified: expect.any(Boolean),
    });
  });

  it('handles wallet with no name', () => {
    vi.mocked(sdkUseWallet).mockReturnValue(
      buildSDKReturn({
        wallets: [{ id: '2', publicKey: 'test-key-2', name: null, verified: false }],
      })
    );

    const { result } = renderHook(() => useWallet());
    expect(result.current.wallets[0].name).toBeUndefined();
    expect(result.current.wallets[0].verified).toBe(false);
  });

  it('provides selectWallet function', () => {
    const { result } = renderHook(() => useWallet());
    expect(typeof result.current.selectWallet).toBe('function');
  });

  it('provides disconnectWallet function', () => {
    const { result } = renderHook(() => useWallet());
    expect(typeof result.current.disconnectWallet).toBe('function');
  });

  it('exposes utility functions', () => {
    const { result } = renderHook(() => useWallet());

    expect(typeof result.current.generateNonce).toBe('function');
    expect(typeof result.current.getChallenge).toBe('function');
    expect(typeof result.current.verifyWallet).toBe('function');
    expect(typeof result.current.renameWallet).toBe('function');
    expect(typeof result.current.getBalance).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  // -------------------------------------------------------------------------
  // disconnectWallet
  // -------------------------------------------------------------------------
  describe('disconnectWallet', () => {
    it('calls unlinkWallet with walletId on success', async () => {
      mockUnlinkWallet.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.disconnectWallet('1'));

      expect(mockUnlinkWallet).toHaveBeenCalledWith('1');
    });

    it('shows success toast on successful disconnect', async () => {
      mockUnlinkWallet.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.disconnectWallet('1'));

      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Wallet disconnected successfully.',
        'Wallet Removed'
      );
    });

    it('shows error toast with user-friendly message on failure', async () => {
      mockUnlinkWallet.mockRejectedValue(makeSdkError('not found', 'WALLET_NOT_FOUND'));

      const { result } = renderHook(() => useWallet());

      await expect(act(() => result.current.disconnectWallet('1'))).rejects.toThrow();

      expect(mockToastError).toHaveBeenCalledWith(
        'Wallet not found. It may have already been removed.',
        'Disconnect Failed'
      );
    });

    it('re-throws transformed error so callers can handle it', async () => {
      mockUnlinkWallet.mockRejectedValue(makeSdkError('bad sig', 'INVALID_SIGNATURE'));

      const { result } = renderHook(() => useWallet());

      await expect(result.current.disconnectWallet('1')).rejects.toThrow(
        'Wallet verification failed: the signature is invalid. Please try again.'
      );
    });

    it('retries on transient NETWORK_ERROR and succeeds', async () => {
      const networkErr = makeTransientError('NETWORK_ERROR');
      mockUnlinkWallet
        .mockRejectedValueOnce(networkErr)
        .mockRejectedValueOnce(networkErr)
        .mockResolvedValue(undefined);

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.disconnectWallet('1'));

      expect(mockUnlinkWallet).toHaveBeenCalledTimes(3);
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    it('retries on TIMEOUT and succeeds', async () => {
      const timeoutErr = makeTransientError('TIMEOUT');
      mockUnlinkWallet.mockRejectedValueOnce(timeoutErr).mockResolvedValue(undefined);

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.disconnectWallet('1'));

      expect(mockUnlinkWallet).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on non-transient errors', async () => {
      const nonTransient = makeSdkError('not found', 'WALLET_NOT_FOUND');
      mockUnlinkWallet.mockRejectedValue(nonTransient);

      const { result } = renderHook(() => useWallet());
      await expect(act(() => result.current.disconnectWallet('1'))).rejects.toThrow();

      expect(mockUnlinkWallet).toHaveBeenCalledTimes(1);
    });

    it('exhausts retries and shows error toast when all attempts fail', async () => {
      const networkErr = makeTransientError('NETWORK_ERROR');
      mockUnlinkWallet.mockRejectedValue(networkErr);

      const { result } = renderHook(() => useWallet());
      await expect(act(() => result.current.disconnectWallet('1'))).rejects.toThrow();

      expect(mockUnlinkWallet).toHaveBeenCalledTimes(3);
      expect(mockToastError).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.',
        'Disconnect Failed'
      );
    });
  });

  it('handles wallet with no name', () => {
    vi.mocked(sdkUseWallet).mockImplementation(() => ({
      wallets: [
        {
          id: '2',
          publicKey: 'test-key-2',
          name: null,
          verified: false,
        },
      ],
      selectedWallet: null,
      loading: false,
      error: null,
      generateNonce: vi.fn(),
      getChallenge: vi.fn(),
      verifyWallet: vi.fn(),
      listWallets: vi.fn(),
      selectWallet: vi.fn(),
      unlinkWallet: vi.fn(),
      renameWallet: vi.fn(),
      getBalance: vi.fn(),
      reset: vi.fn(),
    }));

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.renameWallet('1', 'New Name'));

      expect(mockRenameWallet).toHaveBeenCalledWith('1', 'New Name');
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Wallet renamed successfully.',
        'Wallet Updated'
      );
    });

    it('shows error toast with friendly message on failure', async () => {
      mockRenameWallet.mockRejectedValue(makeSdkError('unauth', 'UNAUTHORIZED'));

      const { result } = renderHook(() => useWallet());
      await expect(act(() => result.current.renameWallet('1', 'Name'))).rejects.toThrow();

      expect(mockToastError).toHaveBeenCalledWith(
        'Your session has expired. Please log in again.',
        'Rename Failed'
      );
    });

    it('retries on transient error', async () => {
      const networkErr = makeTransientError('NETWORK_ERROR');
      mockRenameWallet.mockRejectedValueOnce(networkErr).mockResolvedValue(undefined);

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.renameWallet('1', 'Name'));

      expect(mockRenameWallet).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // verifyWallet
  // -------------------------------------------------------------------------
  describe('verifyWallet', () => {
    it('calls SDK verifyWallet and shows success toast', async () => {
      mockVerifyWallet.mockResolvedValue({ verified: true });

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.verifyWallet('wallet-id', 'signed-challenge'));

      expect(mockVerifyWallet).toHaveBeenCalledWith('wallet-id', 'signed-challenge');
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Wallet verified successfully!',
        'Wallet Verified'
      );
    });

    it('shows error toast for INVALID_SIGNATURE', async () => {
      mockVerifyWallet.mockRejectedValue(makeSdkError('bad sig', 'INVALID_SIGNATURE'));

      const { result } = renderHook(() => useWallet());
      await expect(
        act(() => result.current.verifyWallet('wallet-id', 'bad-sig'))
      ).rejects.toThrow();

      expect(mockToastError).toHaveBeenCalledWith(
        'Wallet verification failed: the signature is invalid. Please try again.',
        'Verification Failed'
      );
    });

    it('shows error toast for CHALLENGE_EXPIRED', async () => {
      mockVerifyWallet.mockRejectedValue(makeSdkError('expired', 'CHALLENGE_EXPIRED'));

      const { result } = renderHook(() => useWallet());
      await expect(act(() => result.current.verifyWallet('wallet-id', 'sig'))).rejects.toThrow();

      expect(mockToastError).toHaveBeenCalledWith(
        'Verification challenge expired. Please start the verification process again.',
        'Verification Failed'
      );
    });

    it('retries on TIMEOUT', async () => {
      const timeoutErr = makeTransientError('TIMEOUT');
      mockVerifyWallet.mockRejectedValueOnce(timeoutErr).mockResolvedValue({ verified: true });

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.verifyWallet('wallet-id', 'sig'));

      expect(mockVerifyWallet).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // getBalance
  // -------------------------------------------------------------------------
  describe('getBalance', () => {
    it('calls SDK getBalance and returns result', async () => {
      const balanceData = { available: 100, pending: 10, total: 110 };
      mockGetBalance.mockResolvedValue(balanceData);

      const { result } = renderHook(() => useWallet());
      let balance: unknown;
      await act(async () => {
        balance = await result.current.getBalance('wallet-id');
      });

      expect(balance).toEqual(balanceData);
    });

    it('shows error toast on getBalance failure', async () => {
      mockGetBalance.mockRejectedValue(makeTransientError('NETWORK_ERROR'));

      const { result } = renderHook(() => useWallet());
      await expect(act(() => result.current.getBalance('wallet-id'))).rejects.toThrow();

      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('Network error'),
        'Balance Unavailable'
      );
    });

    it('retries on SERVICE_UNAVAILABLE', async () => {
      const svcErr = makeTransientError('SERVICE_UNAVAILABLE');
      mockGetBalance
        .mockRejectedValueOnce(svcErr)
        .mockResolvedValue({ available: 50, pending: 0, total: 50 });

      const { result } = renderHook(() => useWallet());
      await act(() => result.current.getBalance('wallet-id'));

      expect(mockGetBalance).toHaveBeenCalledTimes(2);
    });
  });

  describe('optimistic wallet operations (#6)', () => {
    it('disconnectWallet removes the wallet from the list immediately, before the SDK call resolves', async () => {
      let resolveUnlink!: () => void;
      const unlinkWallet = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveUnlink = resolve;
          })
      );
      vi.mocked(sdkUseWallet).mockImplementation(() => ({
        ...defaultSdkWalletResult(),
        unlinkWallet,
      }));

      const { result } = renderHook(() => useWallet());
      expect(result.current.wallets).toHaveLength(1);

      let disconnectPromise!: Promise<void>;
      act(() => {
        disconnectPromise = result.current.disconnectWallet('1');
      });

      // Optimistic: the wallet is gone from the list synchronously, well
      // before the mocked SDK call has resolved.
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
      vi.mocked(sdkUseWallet).mockImplementation(() => ({
        ...defaultSdkWalletResult(),
        unlinkWallet,
      }));

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await expect(result.current.disconnectWallet('1')).rejects.toThrow('network down');
      });

      // Rollback: the wallet is back in the list, no longer pending, and
      // the failure is surfaced with enough context to retry.
      expect(result.current.wallets).toHaveLength(1);
      expect(result.current.isPending('1')).toBe(false);
      expect(result.current.actionError).toEqual({ walletId: '1', message: 'network down' });
    });

    it('renameWallet shows the new name immediately, before the SDK call resolves', async () => {
      let resolveRename!: () => void;
      const renameWallet = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRename = resolve;
          })
      );
      vi.mocked(sdkUseWallet).mockImplementation(() => ({
        ...defaultSdkWalletResult(),
        renameWallet,
      }));

      const { result } = renderHook(() => useWallet());

      let renamePromise!: Promise<void>;
      act(() => {
        renamePromise = result.current.renameWallet('1', 'Renamed Wallet');
      });

      expect(result.current.wallets[0].name).toBe('Renamed Wallet');
      expect(result.current.isPending('1')).toBe(true);

      resolveRename();
      await act(async () => {
        await renamePromise;
      });

      expect(result.current.isPending('1')).toBe(false);
      expect(renameWallet).toHaveBeenCalledWith('1', 'Renamed Wallet');
    });

    it('rolls back to the previous name and surfaces a retryable error when renameWallet fails', async () => {
      const renameWallet = vi.fn().mockRejectedValue(new Error('name already taken'));
      vi.mocked(sdkUseWallet).mockImplementation(() => ({
        ...defaultSdkWalletResult(),
        renameWallet,
      }));

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

    it('isPending prevents double-submission: stays true for the duration of the in-flight call', async () => {
      let resolveUnlink!: () => void;
      const unlinkWallet = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveUnlink = resolve;
          })
      );
      vi.mocked(sdkUseWallet).mockImplementation(() => ({
        ...defaultSdkWalletResult(),
        unlinkWallet,
      }));

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

    it('retryAction re-runs the failed disconnect and clears the previous error on success', async () => {
      const unlinkWallet = vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(undefined);
      vi.mocked(sdkUseWallet).mockImplementation(() => ({
        ...defaultSdkWalletResult(),
        unlinkWallet,
      }));

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

    it('clearActionError resets actionError without retrying', async () => {
      const unlinkWallet = vi.fn().mockRejectedValue(new Error('offline'));
      vi.mocked(sdkUseWallet).mockImplementation(() => ({
        ...defaultSdkWalletResult(),
        unlinkWallet,
      }));

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
