/**
 * Wallet Manager Component
 * Displays and manages user's connected wallets
 */

'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import { Wallet, Trash2, Check } from 'lucide-react';

export interface WalletManagerProps {
  onWalletSelect?: (walletId: string) => void;
}

export function WalletManager({ onWalletSelect }: WalletManagerProps): JSX.Element {
  const { wallets, selectedWallet, loading, error, selectWallet, disconnectWallet } = useWallet();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectWallet = (walletId: string): void => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (wallet) {
      selectWallet(wallet);
      onWalletSelect?.(walletId);
    }
  };

  const handleDisconnect = async (walletId: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await disconnectWallet(walletId);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading wallets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
        <p className="text-sm">Error loading wallets: {error}</p>
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
      {wallets.map((wallet) => (
        <Card
          key={wallet.id}
          className={`p-4 cursor-pointer transition ${
            selectedWallet?.id === wallet.id
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/50'
          }`}
          onClick={() => handleSelectWallet(wallet.id)}
          role="button"
          tabIndex={0}
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
              </div>
            </div>

            <Modal>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition"
                aria-label={`Delete ${wallet.name || 'wallet'}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </div>
        </Card>
      ))}
    </div>
  );
}
