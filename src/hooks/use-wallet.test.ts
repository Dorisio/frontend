import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWallet, WalletInfo } from './use-wallet';

// Mock the SDK hook
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

describe('useWallet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    vi.mocked(require('dorisio-sdk/react').useWallet).mockImplementation(() => ({
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
    vi.mocked(require('dorisio-sdk/react').useWallet).mockImplementation(() => ({
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
    vi.mocked(require('dorisio-sdk/react').useWallet).mockImplementation(() => ({
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
});
