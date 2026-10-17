/**
 * Dorisio Button Component
 * Opens tip modal dialog with preset tiers, custom amounts, wallet selection,
 * and future/recurring tip scheduling
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
import { captureFeatureEvent, useFeatureFlag } from '@/lib/feature-flags';
import { WalletSelector } from '@/components/sections/wallet-selector';
import { useNotification } from '@/components/notification-provider';
import { dedupedRequest } from '@/lib/request-deduplicator';
import { useTipTiers } from '@/hooks/use-tip-tiers';
import { useScheduledTips } from '@/hooks/use-scheduled-tips';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { ScheduledTipFrequency } from '@/types';
import {
  appendEmoji,
  normalizeTipMessage,
  TIP_MESSAGE_MAX_LENGTH,
  validateTipMessage,
} from '@/lib/tip-message';

interface DorisioButtonProps {
  creatorId: string;
  creatorName?: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tipTiers?: number[];
}

const QUICK_EMOJIS = ['👏', '🔥', '💛', '🙌', '✨', '🚀'];
const STROOPS_PER_XLM = 10_000_000;

interface TipReview {
  amount: number;
  fee: number;
  walletId: string;
}

function getEstimatedFee(transaction: unknown): number {
  if (!transaction || typeof transaction !== 'object' || !('fee' in transaction)) {
    throw new Error('The transaction fee estimate is unavailable. Please try again.');
  }

  const fee = Number((transaction as { fee: unknown }).fee);
  if (!Number.isFinite(fee) || fee < 0) {
    throw new Error('The transaction fee estimate is invalid. Please try again.');
  }

  return fee;
}

function formatEstimatedFee(feeInStroops: number): string {
  return `${(feeInStroops / STROOPS_PER_XLM).toFixed(7)} XLM`;
}

function formatTipAmount(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}

function getTransactionStatus(result: unknown): string | undefined {
  if (!result || typeof result !== 'object' || !('status' in result)) return undefined;
  const { status } = result as { status: unknown };
  return typeof status === 'string' ? status : undefined;
}

export default function DorisioButton({
  creatorId,
  creatorName,
  variant = 'default',
  size = 'md',
  className = '',
  tipTiers: propTipTiers,
}: DorisioButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [customAmountError, setCustomAmountError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [tipReview, setTipReview] = useState<TipReview | null>(null);
  const [preparingTip, setPreparingTip] = useState(false);
  const [submittingTip, setSubmittingTip] = useState(false);

  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledDateError, setScheduledDateError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<ScheduledTipFrequency>('once');

  const { createTip, buildTransaction, submitTransaction, confirmTransaction, loading, reset } =
    useCreateTip();
  const { scheduleTip } = useScheduledTips(creatorId);
  const { success, error: notifyError } = useNotification();
  const { wallets, fetchWallets, getPreferredWalletId, setLastUsedWallet, selectWallet } =
    useWallet();
  const schedulingEnabled = useFeatureFlag('scheduled_tips', true) !== false;
  const {
    tiers: activeTiers,
    recentCustomAmounts,
    addRecentCustomAmount,
  } = useTipTiers(creatorId, propTipTiers);

  // Auto-select preferred wallet when modal opens
  useEffect(() => {
    if (isOpen && wallets.length === 0) {
      void fetchWallets().catch(() => {
        // The wallet selector owns its empty/error presentation; opening the
        // tip dialog must not leave an unhandled promise rejection.
      });
    }

    if (isOpen && !selectedWalletId) {
      const preferredId = getPreferredWalletId(creatorId);
      if (preferredId && wallets.some((w) => w.id === preferredId)) {
        setSelectedWalletId(preferredId);
      } else if (wallets.length > 0) {
        setSelectedWalletId(wallets[0].id);
      }
    }
  }, [isOpen, selectedWalletId, creatorId, wallets, getPreferredWalletId, fetchWallets]);

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

  function handleClose(open: boolean, force = false): void {
    if (!open && !force && (loading || preparingTip || submittingTip)) return;
    setIsOpen(open);
    if (!open) {
      setTipReview(null);
      reset();
      setSelectedAmount(null);
      setSelectedWalletId(null);
      setIsCustom(false);
      setCustomAmountInput('');
      setCustomAmountError(null);
      setMessage('');
      setMessageError(null);
      setIsScheduled(false);
      setScheduledDate(null);
      setScheduledDateError(null);
      setFrequency('once');
    }
  }

  function handleSelectPreset(amount: number): void {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmountInput('');
    setCustomAmountError(null);
  }

  function handleCustomAmountChange(value: string): void {
    setCustomAmountInput(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setSelectedAmount(null);
      setCustomAmountError(null);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || parsed <= 0) {
      setSelectedAmount(null);
      setCustomAmountError('Please enter an amount greater than $0');
    } else {
      setSelectedAmount(parsed);
      setCustomAmountError(null);
    }
  }

  function handleSelectRecent(amount: number): void {
    setIsCustom(true);
    setCustomAmountInput(amount.toString());
    setSelectedAmount(amount);
    setCustomAmountError(null);
  }

  async function handleSendTip(): Promise<void> {
    if (
      !selectedAmount ||
      !selectedWalletId ||
      loading ||
      preparingTip ||
      submittingTip ||
      Boolean(customAmountError)
    )
      return;

    const amount = selectedAmount;
    const walletId = selectedWalletId;

    if (isScheduled) {
      if (!scheduledDate) {
        setScheduledDateError('Please select a date and time');
        return;
      }
      if (scheduledDate.getTime() <= Date.now()) {
        setScheduledDateError('Scheduled date must be in the future');
        return;
      }
    }

    const normalizedMsg = normalizeTipMessage(message);
    const validationError = validateTipMessage(normalizedMsg);
    if (validationError) {
      setMessageError(validationError);
      return;
    }

    // Scheduled tip path
    if (isScheduled && scheduledDate) {
      scheduleTip({
        creatorId,
        creatorName,
        amount,
        scheduledDate,
        frequency,
        walletId: selectedWalletId,
        message: normalizedMsg || undefined,
      });

      if (isCustom && amount > 0) {
        addRecentCustomAmount(amount);
      }
      setLastUsedWallet(creatorId, walletId);
      const freqLabel = frequency === 'once' ? '' : ` (${frequency})`;
      success(
        `Tip of $${amount} scheduled for ${scheduledDate.toLocaleDateString()}${freqLabel}!`,
        'Tip Scheduled'
      );
      handleClose(false);
      return;
    }

    const dedupeKey = `create-tip:${creatorId}:${amount}:${walletId}:${normalizedMsg}`;

    try {
      setPreparingTip(true);
      const fee = await dedupedRequest(async () => {
        const wallet = wallets.find((candidate) => candidate.id === walletId);
        if (!wallet) throw new Error('The selected wallet is no longer available.');
        selectWallet(wallet);
        await createTip({
          creatorId,
          amount,
          message: normalizedMsg || undefined,
        });
        return getEstimatedFee(await buildTransaction());
      }, dedupeKey);
      setTipReview({ amount, fee, walletId });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to prepare tip';
      captureFeatureEvent('tip_failed', { amount });
      notifyError(errMessage, 'Tip failed');
    } finally {
      setPreparingTip(false);
    }
  }

  async function handleConfirmTip(): Promise<void> {
    if (!tipReview || loading || preparingTip || submittingTip) return;

    const { amount, walletId } = tipReview;
    setSubmittingTip(true);
    try {
      const submission = await submitTransaction();
      const submissionStatus = getTransactionStatus(submission);
      if (submissionStatus === 'failed' || submissionStatus === 'error') {
        captureFeatureEvent('tip_failed', { amount, scheduled: false });
        notifyError('The payment could not be completed. Please try again.', 'Tip failed');
        return;
      }

      let finalResult = submission;
      try {
        finalResult = (await confirmTransaction()) ?? submission;
      } catch {
        // The submission may still confirm asynchronously.
      }

      const status = getTransactionStatus(finalResult) ?? submissionStatus;
      if (status === 'failed' || status === 'error') {
        captureFeatureEvent('tip_failed', { amount, scheduled: false });
        notifyError('The payment could not be completed. Please try again.', 'Tip failed');
        return;
      }

      captureFeatureEvent('tip_succeeded', { amount, scheduled: false });
      if (isCustom && amount > 0) {
        addRecentCustomAmount(amount);
      }
      setLastUsedWallet(creatorId, walletId);
      const paymentConfirmed = status === 'confirmed' || status === 'success';
      success(
        paymentConfirmed
          ? `Tip of $${amount} confirmed!`
          : `Tip of $${amount} submitted. Confirmation is pending.`,
        paymentConfirmed ? 'Thank you' : 'Payment pending'
      );
      handleClose(false, true);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to send tip';
      captureFeatureEvent('tip_failed', { amount });
      notifyError(errMessage, 'Tip failed');
    } finally {
      setSubmittingTip(false);
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
            <ModalTitle>{tipReview ? 'Review Tip' : 'Send a Tip'}</ModalTitle>
            <ModalDescription>
              {tipReview
                ? 'Review the tip amount and estimated network fee before confirming.'
                : preparingTip
                  ? 'Preparing the transaction and estimating its network fee.'
                  : 'Support this creator with an instant USDC payment'}
            </ModalDescription>
          </ModalHeader>
          {tipReview && (
            <div className="px-6 py-4 space-y-4" aria-label="Tip total breakdown">
              <p className="font-semibold" data-testid="tip-confirmation-question">
                Send ${formatTipAmount(tipReview.amount)} tip to {creatorName ?? 'this creator'}?
              </p>
              <div className="flex justify-between gap-4 text-sm">
                <span>Recipient</span>
                <span>{creatorName ?? 'This creator'}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span>Tip amount</span>
                <span>${formatTipAmount(tipReview.amount)} USDC</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span>Estimated network fee</span>
                <span>{formatEstimatedFee(tipReview.fee)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3 font-semibold">
                <span>Total</span>
                <span>
                  ${formatTipAmount(tipReview.amount)} USDC + {formatEstimatedFee(tipReview.fee)}
                </span>
              </div>
            </div>
          )}
          {preparingTip && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground" role="status">
              Preparing transaction and fee estimate...
            </div>
          )}
          <div className="px-6 py-4 space-y-4" hidden={Boolean(tipReview || preparingTip)}>
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
            <div className="space-y-3">
              <label className="text-sm font-medium">Select amount:</label>

              {/* Preset buttons + Custom toggle in responsive mobile-friendly grid */}
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                aria-label="Preset tip amounts"
              >
                {activeTiers.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleSelectPreset(amount)}
                    disabled={loading}
                    aria-pressed={!isCustom && selectedAmount === amount}
                    className={`py-2 px-3 border rounded font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      !isCustom && selectedAmount === amount
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    if (
                      customAmountInput &&
                      !isNaN(Number(customAmountInput)) &&
                      Number(customAmountInput) > 0
                    ) {
                      setSelectedAmount(Number(customAmountInput));
                    } else {
                      setSelectedAmount(null);
                    }
                  }}
                  disabled={loading}
                  aria-pressed={isCustom}
                  className={`py-2 px-3 border rounded font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCustom
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom amount input field */}
              {isCustom && (
                <div className="space-y-1.5 pt-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Enter custom amount"
                      value={customAmountInput}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      disabled={loading}
                      aria-label="Custom tip amount"
                      className="w-full pl-7 pr-3 py-2 border rounded-md text-sm bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  {customAmountError && (
                    <p role="alert" className="text-xs text-destructive">
                      {customAmountError}
                    </p>
                  )}
                </div>
              )}

              {/* Recent custom amounts for quick access (up to 3) */}
              {recentCustomAmounts.length > 0 && (
                <div className="space-y-1.5 pt-1" aria-label="Recent custom tips">
                  <span className="text-xs text-muted-foreground">Recent custom amounts:</span>
                  <div className="flex flex-wrap gap-2">
                    {recentCustomAmounts.map((recent) => (
                      <button
                        key={`recent-${recent}`}
                        type="button"
                        onClick={() => handleSelectRecent(recent)}
                        disabled={loading}
                        className={`px-2.5 py-1 text-xs border rounded-full transition hover:bg-muted ${
                          isCustom && selectedAmount === recent
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}
                        aria-label={`Recent tip $${recent}`}
                      >
                        ${recent}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scheduled Tips Section */}
            {schedulingEnabled && (
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Schedule for future delivery</span>
                    <p className="text-xs text-muted-foreground">
                      Plan tips for birthdays, special dates, or recurring support
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isScheduled;
                      setIsScheduled(next);
                      if (next && !scheduledDate) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setScheduledDate(tomorrow);
                        setScheduledDateError(null);
                      }
                    }}
                    aria-pressed={isScheduled}
                    className={`px-3 py-1 text-xs font-semibold rounded border transition ${
                      isScheduled
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {isScheduled ? 'Scheduled ✓' : 'Schedule Tip ⏰'}
                  </button>
                </div>

                {isScheduled && (
                  <div className="p-3 bg-muted/30 border rounded-lg space-y-3 animate-fade-in">
                    <div className="space-y-1.5">
                      <label htmlFor="scheduled-date-picker" className="text-xs font-medium">
                        Select Delivery Date & Time:
                      </label>
                      <DateTimePicker
                        id="scheduled-date-picker"
                        selected={scheduledDate}
                        onChange={(date: Date | null) => {
                          setScheduledDate(date);
                          if (date && date.getTime() > Date.now()) {
                            setScheduledDateError(null);
                          } else if (date) {
                            setScheduledDateError('Scheduled date must be in the future');
                          }
                        }}
                        disabled={loading}
                        minDate={new Date()}
                      />
                      {scheduledDateError && (
                        <p role="alert" className="text-xs text-destructive">
                          {scheduledDateError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Repeat frequency:</label>
                      <div
                        className="grid grid-cols-4 gap-1.5"
                        role="radiogroup"
                        aria-label="Recurring frequency"
                      >
                        {(
                          [
                            { value: 'once', label: 'One-time' },
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFrequency(opt.value)}
                            aria-checked={frequency === opt.value}
                            role="radio"
                            className={`py-1.5 px-2 text-xs font-medium rounded border transition text-center ${
                              frequency === opt.value
                                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                : 'bg-background hover:bg-muted text-foreground'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message input */}
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

            {/* Share link */}
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
              disabled={loading || preparingTip || submittingTip}
              className="px-4 py-2 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={tipReview ? handleConfirmTip : handleSendTip}
              disabled={
                tipReview
                  ? loading || preparingTip || submittingTip
                  : !selectedAmount ||
                    !selectedWalletId ||
                    loading ||
                    preparingTip ||
                    submittingTip ||
                    Boolean(messageError) ||
                    Boolean(customAmountError) ||
                    (isScheduled && (!scheduledDate || Boolean(scheduledDateError)))
              }
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingTip || loading
                ? 'Sending...'
                : preparingTip
                  ? 'Preparing fee...'
                  : tipReview
                    ? 'Confirm & Send'
                    : isScheduled
                      ? 'Schedule Tip'
                      : 'Continue'}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
