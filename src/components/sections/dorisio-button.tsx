/**
 * Dorisio Button Component
 * Opens tip modal dialog
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import { WalletSelector } from '@/components/sections/wallet-selector';
import { useWallet } from '@/hooks/use-wallet';

interface DorisioButtonProps {
  creatorId: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DorisioButton({
  creatorId,
  variant = 'default',
  size = 'md',
  className = '',
}: DorisioButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const { wallets, getPreferredWalletId, setLastUsedWallet } = useWallet();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !selectedWalletId && wallets.length > 0) {
      setSelectedWalletId(getPreferredWalletId(creatorId) || wallets[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, wallets.length]);

  const handleContinue = (): void => {
    if (selectedWalletId) {
      setLastUsedWallet(creatorId, selectedWalletId);
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-primary text-primary hover:bg-primary/5',
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`rounded font-semibold transition ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        💰 Send a Tip
      </button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Send a Tip</ModalTitle>
            <ModalDescription>Support this creator with an instant USDC payment</ModalDescription>
          </ModalHeader>
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground mb-4">Creator ID: {creatorId}</p>
            <div className="space-y-3 mb-4">
              <p className="text-sm font-medium">Tip from:</p>
              <WalletSelector value={selectedWalletId} onChange={setSelectedWalletId} />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Select amount:</p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 25].map((amount) => (
                  <button
                    key={amount}
                    className="py-2 px-3 border rounded font-semibold text-sm hover:bg-muted transition"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ModalFooter>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm border rounded hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedWalletId}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
