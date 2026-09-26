/**
 * Dorisio Button Component
 * Opens tip modal dialog
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import { useCreateTip } from '@/hooks/use-create-tip';
import { useWallet } from '@/hooks/use-wallet';
import { useNotification } from '@/components/notification-provider';
import { dedupedRequest } from '@/lib/request-deduplicator';
import { WalletSelector } from '@/components/sections/wallet-selector';

interface DorisioButtonProps {
  creatorId: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIP_AMOUNTS = [1, 5, 10, 25];

export default function DorisioButton({
  creatorId,
  variant = 'default',
  size = 'md',
  className = '',
}: DorisioButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const { createTip, loading } = useCreateTip();
  const { success, error: notifyError } = useNotification();
  const { wallets, getPreferredWalletId, setLastUsedWallet } = useWallet();

  // Auto-select preferred wallet when modal opens
  useEffect(() => {
    if (isOpen && !selectedWalletId) {
      const preferredId = getPreferredWalletId(creatorId);
      if (preferredId && wallets.some((w) => w.id === preferredId)) {
        setSelectedWalletId(preferredId);
      } else if (wallets.length > 0) {
        setSelectedWalletId(wallets[0].id);
      }
    }
  }, [isOpen, selectedWalletId, creatorId, wallets, getPreferredWalletId]);

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-primary text-primary hover:bg-primary/5',
  };

  function handleClose(open: boolean): void {
    setIsOpen(open);
    if (!open) {
      setSelectedAmount(null);
      setSelectedWalletId(null);
    }
  }

  async function handleSendTip(): Promise<void> {
    if (!selectedAmount || !selectedWalletId || loading) return;

    const dedupeKey = `create-tip:${creatorId}:${selectedAmount}:${selectedWalletId}`;

    try {
      await dedupedRequest(() => createTip({ creatorId, amount: selectedAmount }), dedupeKey);
      // Track wallet preference for this creator
      setLastUsedWallet(creatorId, selectedWalletId);
      success(`Tip of $${selectedAmount} sent!`, 'Thank you');
      handleClose(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send tip';
      notifyError(message, 'Tip failed');
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`rounded font-semibold transition ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        💰 Send a Tip
      </button>

      <Modal open={isOpen} onOpenChange={handleClose}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Send a Tip</ModalTitle>
            <ModalDescription>Support this creator with an instant USDC payment</ModalDescription>
          </ModalHeader>
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Creator ID: {creatorId}</p>

            {/* Wallet Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select wallet:</label>
              <WalletSelector
                value={selectedWalletId}
                onChange={setSelectedWalletId}
                disabled={loading}
              />
            </div>

            {/* Amount Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select amount:</label>
              <div className="grid grid-cols-4 gap-2">
                {TIP_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    disabled={loading}
                    aria-pressed={selectedAmount === amount}
                    className={`py-2 px-3 border rounded font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedAmount === amount
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ModalFooter>
            <button
              onClick={() => handleClose(false)}
              disabled={loading}
              className="px-4 py-2 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTip}
              disabled={!selectedAmount || !selectedWalletId || loading}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
