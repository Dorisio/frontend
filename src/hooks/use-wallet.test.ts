import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet, mapWalletError } from './use-wallet';
import { useWallet as sdkUseWalletImpl } from 'dorisio-sdk/react';

// Cast to mocked function so .mockReturnValue is available
const sdkUseWallet = sdkUseWalletImpl as MockedFunction<typeof sdkUseWalletImpl>;

// ---------------------------------------------------------------------------
// Mocks — factories must NOT reference top-level variables (vi.mock is hoisted)
// ---------------------------------------------------------------------------

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('@/components/notification-provider', () => ({
  useNotification: (): {
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    notify: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  } => ({
    error: mockToastError,
    success: mockToastSuccess,
    notify: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

// All SDK mock functions are declared at module scope so they can be
// reconfigured per-test. The vi.mock factory accesses them via closure
// rather than referencing the const before hoisting.
const mockUnlinkWallet = vi.fn();
const mockRenameWallet = vi.fn();
const mockVerifyWallet = vi.fn();
const mockGetBalance = vi.fn();
const mockListWallets = vi.fn();
const mockSelectWallet = vi.fn();
const mockGenerateNonce = vi.fn();
const mockGetChallenge = vi.fn();
const mockReset = vi.fn();

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
    vi.mocked(sdkUseWallet).mockReturnValue(
      buildSDKReturn({ loading: true })
    );

    const { result } = renderHook(() => useWallet());
    expect(result.current.loading).toBe(true);
  });

  it('handles error state from SDK', () => {
    vi.mocked(sdkUseWallet).mockReturnValue(
      buildSDKReturn({ error: 'Failed to load wallets' })
    );

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

  // -------------------------------------------------------------------------
  // renameWallet
  // -------------------------------------------------------------------------
  describe('renameWallet', () => {
    it('calls SDK renameWallet and shows success toast', async () => {
      mockRenameWallet.mockResolvedValue(undefined);

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
});
