/**
 * Wallet Manager Component
 * Modal dialog for managing connected wallets
 * Handles: connecting new wallets, disconnecting, viewing balances
 */

'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { formatCurrency } from '@/utils/formatters';

interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ManagerStep = 'list' | 'connect' | 'confirm-disconnect';

interface DisconnectConfirm {
  walletId: string;
  publicKey: string;
}

export default function WalletManager({ isOpen, onClose }: WalletManagerProps) {
  const { wallets, loading, error, disconnectWallet, getBalance } = useWallet();

  const [step, setStep] = useState<ManagerStep>('list');
  const [disconnectConfirm, setDisconnectConfirm] = useState<DisconnectConfirm | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [walletBalances, setWalletBalances] = useState<Record<string, { available: number }>>({});
  const [loadingBalances, setLoadingBalances] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleDisconnect = async () => {
    if (!disconnectConfirm) return;

    try {
      await disconnectWallet(disconnectConfirm.walletId);
      setDisconnectConfirm(null);
      setStep('list');
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  const handleGetBalance = async (walletId: string) => {
    try {
      setLoadingBalances((prev) => new Set(prev).add(walletId));
      const balance = await getBalance(walletId);
      setWalletBalances((prev) => ({ ...prev, [walletId]: balance }));
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setLoadingBalances((prev) => {
        const next = new Set(prev);
        next.delete(walletId);
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {step === 'list' && 'Manage Wallets'}
            {step === 'connect' && 'Connect Wallet'}
            {step === 'confirm-disconnect' && 'Disconnect Wallet?'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4 max-h-96 overflow-y-auto">
          {step === 'list' && (
            <>
              {/* Connected Wallets List */}
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading wallets...</p>
                ) : wallets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No wallets connected yet.
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      Connected Wallets ({wallets.length})
                    </p>
                    {wallets.map((wallet) => (
                      <div key={wallet.id} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-sm">
                              {wallet.name || 'Unnamed Wallet'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono break-all">
                              {wallet.publicKey.slice(0, 16)}...{wallet.publicKey.slice(-8)}
                            </p>
                            {wallet.verified && (
                              <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setDisconnectConfirm({
                                walletId: wallet.id,
                                publicKey: wallet.publicKey,
                              });
                              setStep('confirm-disconnect');
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Balance */}
                        <button
                          onClick={() => handleGetBalance(wallet.id)}
                          className="w-full text-left px-2 py-2 rounded hover:bg-muted/50 transition text-xs text-muted-foreground hover:text-foreground"
                        >
                          {loadingBalances.has(wallet.id) ? (
                            'Loading balance...'
                          ) : walletBalances[wallet.id] ? (
                            <>
                              <span className="font-semibold">
                                {formatCurrency(walletBalances[wallet.id]?.available || 0)}
                              </span>
                              {' available'}
                            </>
                          ) : (
                            'View balance'
                          )}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </>
          )}

          {step === 'connect' && (
            <>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  To connect a wallet, you'll need to sign a message with your wallet. Make sure you
                  have Freighter installed and configured.
                </p>

                {connectError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                    {connectError}
                  </div>
                )}

                <button
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : 'Connect with Freighter'}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Freighter is a secure wallet extension for Stellar
                </p>
              </div>
            </>
          )}

          {step === 'confirm-disconnect' && disconnectConfirm && (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-red-900">Remove this wallet?</p>
                  <p className="text-sm text-red-800">
                    {disconnectConfirm.publicKey.slice(0, 16)}...
                    {disconnectConfirm.publicKey.slice(-8)}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  You can always reconnect this wallet later. Any pending tips will need to be
                  resent.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3">
          {step === 'list' && (
            <>
              <button
                onClick={() => {
                  setConnectError(null);
                  setStep('connect');
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold"
              >
                + Add Wallet
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-muted transition"
              >
                Close
              </button>
            </>
          )}

          {step === 'connect' && (
            <>
              <button
                onClick={() => {
                  setConnectError(null);
                  setStep('list');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-muted transition"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-muted transition"
              >
                Close
              </button>
            </>
          )}

          {step === 'confirm-disconnect' && (
            <>
              <button
                onClick={() => setStep('list')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Removing...' : 'Remove'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
