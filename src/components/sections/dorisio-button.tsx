/**
 * Dorisio Button Component
 * Opens tip modal dialog
 */

'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import { useCreateTip } from '@/hooks/use-create-tip';
import { useNotification } from '@/components/notification-provider';
import { dedupedRequest } from '@/lib/request-deduplicator';

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
  const { createTip, loading } = useCreateTip();
  const { success, error: notifyError } = useNotification();

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
    }
  }

  async function handleSendTip(): Promise<void> {
    if (!selectedAmount || loading) return;

    const dedupeKey = `create-tip:${creatorId}:${selectedAmount}`;

    try {
      await dedupedRequest(() => createTip({ creatorId, amount: selectedAmount }), dedupeKey);
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
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground mb-4">Creator ID: {creatorId}</p>
            <div className="space-y-3">
              <p className="text-sm font-medium">Select amount:</p>
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
              disabled={!selectedAmount || loading}
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
