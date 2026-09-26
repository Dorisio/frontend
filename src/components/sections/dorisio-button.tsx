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
import {
  appendEmoji,
  normalizeTipMessage,
  TIP_MESSAGE_MAX_LENGTH,
  validateTipMessage,
} from '@/lib/tip-message';

interface DorisioButtonProps {
  creatorId: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIP_AMOUNTS = [1, 5, 10, 25];
const QUICK_EMOJIS = ['👏', '🔥', '💛', '🙌', '✨', '🚀'];

export default function DorisioButton({
  creatorId,
  variant = 'default',
  size = 'md',
  className = '',
}: DorisioButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
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

  const normalizedMessage = normalizeTipMessage(message);
  const shareText = selectedAmount
    ? `I just supported a creator with a ${selectedAmount} tip on Dorisio${
        normalizedMessage ? `: ${normalizedMessage}` : ''
      }`
    : 'I am supporting creators on Dorisio';
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;
  const socialShareLinks = [
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  function handleClose(open: boolean): void {
    setIsOpen(open);
    if (!open) {
      setSelectedAmount(null);
      setMessage('');
      setMessageError(null);
    }
  }

  async function handleSendTip(): Promise<void> {
    if (!selectedAmount || !selectedWalletId || loading) return;

    const normalizedMessage = normalizeTipMessage(message);
    const validationError = validateTipMessage(normalizedMessage);
    if (validationError) {
      setMessageError(validationError);
      return;
    }

    const dedupeKey = `create-tip:${creatorId}:${selectedAmount}:${normalizedMessage}`;

    try {
      await dedupedRequest(
        () =>
          createTip({
            creatorId,
            amount: selectedAmount,
            message: normalizedMessage || undefined,
          }),
        dedupeKey
      );
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
            <div className="space-y-3 mt-5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="tip-message" className="text-sm font-medium">
                  Message <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  {message.length}/{TIP_MESSAGE_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id="tip-message"
                value={message}
                maxLength={TIP_MESSAGE_MAX_LENGTH}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setMessageError(validateTipMessage(event.target.value));
                }}
                placeholder="Add a note to brighten their day"
                className="min-h-24 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                disabled={loading}
              />
              <div className="flex flex-wrap gap-2" aria-label="Quick emoji picker">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      const nextMessage = appendEmoji(message, emoji);
                      setMessage(nextMessage);
                      setMessageError(validateTipMessage(nextMessage));
                    }}
                    disabled={loading || message.length >= TIP_MESSAGE_MAX_LENGTH}
                    className="h-9 w-9 rounded-md border text-lg hover:bg-muted disabled:opacity-50"
                    aria-label={`Add ${emoji} emoji`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {messageError && <p className="text-xs text-red-600">{messageError}</p>}
            </div>
            <div className="mt-5 rounded-md border p-3">
              <p className="text-sm font-medium">Share your support</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {socialShareLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    {link.label}
                  </a>
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
              disabled={!selectedAmount || loading || Boolean(messageError)}
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
