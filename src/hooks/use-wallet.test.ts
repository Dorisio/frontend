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
  useWallet: vi.fn(() => ({
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
  })),
}));

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
    vi.mocked(sdkUseWallet).mockImplementation(defaultSdkWalletResult);
  });

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

    expect(result.current.wallets[0].name).toBeUndefined();
    expect(result.current.wallets[0].verified).toBe(false);
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
