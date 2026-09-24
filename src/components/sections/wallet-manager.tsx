/**
 * Wallet Manager Component
 * Displays and manages user's connected wallets with full error state UI.
 */

'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import { Wallet, Trash2, Check, AlertCircle } from 'lucide-react';

export interface WalletManagerProps {
  onWalletSelect?: (walletId: string) => void;
}

export function WalletManager({ onWalletSelect }: WalletManagerProps): JSX.Element {
  const { wallets, selectedWallet, loading, error, selectWallet, disconnectWallet } = useWallet();

  // Per-wallet operation state: tracks loading and inline error per wallet ID.
  const [operationState, setOperationState] = useState<
    Record<string, { loading: boolean; error: string | null }>
  >({});

  const getOpState = (walletId: string): { loading: boolean; error: string | null } =>
    operationState[walletId] ?? { loading: false, error: null };

  const setOpState = (
    walletId: string,
    update: Partial<{ loading: boolean; error: string | null }>
  ): void => {
    setOperationState((prev) => ({
      ...prev,
      [walletId]: { ...getOpState(walletId), ...update },
    }));
  };

  const clearOpError = (walletId: string): void => setOpState(walletId, { error: null });

  const handleSelectWallet = (walletId: string): void => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (wallet) {
      selectWallet(wallet);
      onWalletSelect?.(walletId);
    }
  };

  const handleDisconnect = async (walletId: string): Promise<void> => {
    setOpState(walletId, { loading: true, error: null });
    try {
      await disconnectWallet(walletId);
      // On success the wallet list will update via the hook; clear state.
      setOpState(walletId, { loading: false, error: null });
    } catch (err) {
      // The hook already fired a toast. Store the message inline as well
      // so the UI reflects the failure without relying solely on the toast.
      const message = err instanceof Error ? err.message : 'Failed to disconnect wallet.';
      setOpState(walletId, { loading: false, error: message });
    }
  };

  // -------------------------------------------------------------------------
  // Global loading / error states
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" role="status" aria-label="Loading wallets">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading wallets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Error loading wallets</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground">No wallets connected</p>
        <p className="text-xs text-muted-foreground mt-1">Connect a wallet to get started</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {wallets.map((wallet) => {
        const opState = getOpState(wallet.id);
        const isWalletBusy = opState.loading;
        const walletError = opState.error;

        return (
          <Card
            key={wallet.id}
            className={`p-4 transition ${
              selectedWallet?.id === wallet.id
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            } ${isWalletBusy ? 'opacity-70 pointer-events-none' : 'cursor-pointer'}`}
            onClick={() => !isWalletBusy && handleSelectWallet(wallet.id)}
            role="button"
            tabIndex={isWalletBusy ? -1 : 0}
            aria-disabled={isWalletBusy}
            data-testid={`wallet-${wallet.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {selectedWallet?.id === wallet.id ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {wallet.name || `Wallet ${wallet.publicKey.slice(0, 8)}...`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{wallet.publicKey}</p>
                  {wallet.verified && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ Verified
                    </span>
                  )}

                  {/* Inline per-wallet error message */}
                  {walletError && (
                    <div
                      className="mt-2 flex items-start gap-1 text-xs text-destructive"
                      role="alert"
                      aria-live="polite"
                      data-testid={`wallet-error-${wallet.id}`}
                    >
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{walletError}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearOpError(wallet.id);
                        }}
                        className="ml-1 underline hover:no-underline"
                        aria-label="Dismiss error"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <Modal>
                <ModalTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={`Delete ${wallet.name || 'wallet'}`}
                    disabled={isWalletBusy}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Disconnect Wallet?</ModalTitle>
                    <ModalDescription>
                      This action will disconnect {wallet.name || 'this wallet'} from your account.
                    </ModalDescription>
                  </ModalHeader>
                  <ModalFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDisconnect(wallet.id)}
                      disabled={isWalletBusy}
                      aria-busy={isWalletBusy}
                    >
                      {isWalletBusy ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
