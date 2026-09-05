/**
 * Dorisio Modal Component
 * Modal dialog for sending tips
 * Handles: amount input, message, wallet selection, Freighter signing, and transaction states
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateTip } from '@/hooks/use-create-tip';
import { useWallet } from '@/hooks/use-wallet';
import { useAuthStore } from '@/stores/auth-store';
import { TipFormSchema, TipFormData } from '@/utils/validators';
import { formatCurrency } from '@/utils/formatters';

interface DorisioModalProps {
  creatorId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DorisioModal({ creatorId, isOpen, onClose }: DorisioModalProps) {
  const user = useAuthStore((state) => state.user);
  const {
    createTip,
    buildTransaction,
    submitTransaction,
    confirmTransaction,
    loading: tipLoading,
    error: tipError,
    step: tipStep,
    reset: resetTip,
  } = useCreateTip();
  const {
    wallets,
    selectedWallet,
    selectWallet,
    generateNonce,
    getChallenge,
    verifyWallet,
    loading: walletLoading,
  } = useWallet();
  const [step, setStep] = useState<'amount' | 'confirm' | 'signing' | 'pending' | 'success' | 'error'>('amount');
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<TipFormData>({
    resolver: zodResolver(TipFormSchema),
  });

  const amount = watch('amount');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
      resetTip();
      setStep('amount');
      setTransactionError(null);
    }
  }, [isOpen, reset, resetTip]);

  const onSubmit = async (data: TipFormData) => {
    try {
      if (!selectedWallet) {
        throw new Error('Please select a wallet');
      }

      // Step 1: Create tip
      setStep('confirm');
      const tip = await createTip({
        creatorId,
        amount: data.amount,
        message: data.message,
      });

      if (!tip) {
        throw new Error('Failed to create tip');
      }

      // Step 2: Build transaction
      setStep('signing');
      const { transactionEnvelope } = await buildTransaction(tip.id, {
        senderPublicKey: selectedWallet.publicKey,
        creatorPublicKey: creatorId, // Would need creator's wallet from profile
        amount: String(data.amount),
      });

      // Step 3: Sign with Freighter (simulated for now)
      // In production, integrate with Freighter SDK here
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 4: Submit transaction
      setStep('pending');
      await submitTransaction(tip.id, transactionEnvelope);

      // Step 5: Confirm on blockchain
      const confirmed = await confirmTransaction(tip.id);

      if (confirmed) {
        setStep('success');
        setTimeout(() => {
          onClose();
          reset();
          resetTip();
        }, 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process tip';
      setTransactionError(message);
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Send a Tip</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 'amount' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!user && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  <p className="text-sm font-medium">Please log in to send tips</p>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  placeholder="0.00"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Message (optional)</label>
                <textarea
                  placeholder="Say something nice!"
                  {...register('message')}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              {/* Wallet Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Wallet</label>
                <select
                  {...register('walletId')}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={walletLoading}
                >
                  {wallets.length === 0 ? (
                    <option value="">No wallets available</option>
                  ) : (
                    <>
                      <option value="">Select a wallet</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name || `${w.publicKey.slice(0, 8)}...`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {errors.walletId && (
                  <p className="text-red-500 text-sm mt-1">{errors.walletId.message}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!user || wallets.length === 0}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition font-semibold"
                >
                  Send {amount ? formatCurrency(amount) : 'Tip'}
                </button>
              </div>
            </form>
          )}

          {step === 'confirm' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">💰</div>
              <h3 className="text-lg font-semibold">Confirm Tip</h3>
              <p className="text-muted-foreground">Preparing tip transaction...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {step === 'signing' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✍️</div>
              <h3 className="text-lg font-semibold">Sign with Freighter</h3>
              <p className="text-muted-foreground">
                Please sign the transaction in your Freighter wallet...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {step === 'pending' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">⏳</div>
              <h3 className="text-lg font-semibold">Transaction Pending</h3>
              <p className="text-muted-foreground">
                Waiting for blockchain confirmation...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✨</div>
              <h3 className="text-lg font-semibold">Tip Sent!</h3>
              <p className="text-muted-foreground">
                Thank you for supporting this creator!
              </p>
              <p className="text-sm text-green-600">Transaction confirmed on Stellar</p>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl">❌</div>
                <h3 className="text-lg font-semibold mt-2">Error</h3>
              </div>
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="text-sm">{transactionError || tipError}</p>
              </div>
              <button
                onClick={() => setStep('amount')}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-muted transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
