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
import { useCreateTip } from '@/hooks/use-create-tip';
import { useNotification } from '@/components/notification-provider';
import { dedupedRequest } from '@/lib/request-deduplicator';
import { EmojiPicker } from '@/components/shared/emoji-picker';
import { useWallet } from '@/hooks/use-wallet';

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
  const { wallets, getPreferredWalletId, setLastUsedWallet } = useWallet();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const { createTip, loading } = useCreateTip();
  const { success: notifySuccess, error: notifyError } = useNotification();

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

  function handleClose(open: boolean): void {
    setIsOpen(open);
    if (!open) {
      setSelectedAmount(null);
      setMessage('');
    }
  }

  async function handleSendTip(): Promise<void> {
    if (!selectedAmount || loading) return;

    // Fingerprint by creator + amount so a double-click (two calls fired
    // before the first request resolves) reuses the same in-flight request
    // instead of creating two tips, and transient network failures are
    // retried with backoff instead of failing outright.
    const dedupeKey = `create-tip:${creatorId}:${selectedAmount}`;

    try {
      await dedupedRequest(
        () =>
          createTip({
            creatorId,
            amount: selectedAmount,
            message: message.trim() || undefined,
          }),
        dedupeKey
      );
      notifySuccess(`Tip of $${selectedAmount} sent!`, 'Thank you');
      handleClose(false);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to send tip';
      notifyError(errMessage, 'Tip failed');
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
            <div className="space-y-3">
              <p className="text-sm font-medium">Tip from:</p>
              <WalletSelector value={selectedWalletId} onChange={setSelectedWalletId} />
            </div>
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
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>Optional message (max 255 chars)</span>
                <EmojiPicker
                  onEmojiSelect={(emoji) =>
                    setMessage((prev) => {
                      const newMsg = prev + emoji;
                      return newMsg.length > 255 ? prev : newMsg;
                    })
                  }
                />
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  const newMsg = e.target.value.slice(0, 255);
                  setMessage(newMsg);
                }}
                placeholder="Share why you're supporting this creator..."
                className="input-dark resize-none"
                rows={3}
                maxLength={255}
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/255
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
