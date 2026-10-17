/**
 * Creator Dashboard Page
 * Private dashboard at /creators/[username]/dashboard
 * Shows earnings overview, transaction history, and wallet management
 */

'use client';

import { useState, Suspense, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCreatorBalance } from '@/hooks/use-creator-balance';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { useTransactionFilter } from '@/hooks/use-transaction-filter';
import { useCreateTip } from '@/hooks/use-create-tip';
import { useNotification } from '@/components/notification-provider';
import { TransactionFilterBar } from '@/components/sections/transaction-filter-bar';
import { TransactionVerification } from '@/components/sections/transaction-verification';
import { useWallet } from '@/hooks/use-wallet';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  getUserTimezoneShort,
} from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Transaction } from '@/hooks/use-transaction-history';
import {
  EarningsCardSkeleton,
  TransactionTableSkeleton,
} from '@/components/shared/creator-skeletons';
import { CreatorVerificationBadge } from '@/components/shared/creator-verification-badge';
import { PushNotificationPermissionPrompt } from '@/components/shared/push-notification-permission-prompt';
import Link from 'next/link';
import { SubscriptionManagement } from '@/components/sections/subscription-management';
import { TipTierSettings } from '@/components/sections/tip-tier-settings';
import { CreatorTierBenefits } from '@/components/sections/creator-tier-benefits';
import { ScheduledTipsDashboard } from '@/components/sections/scheduled-tips-dashboard';
import { CreatorCollaborations } from '@/components/sections/creator-collaborations';
import { CreatorCommissionRequests } from '@/components/sections/creator-commission-requests';
import { ExclusiveContentCreatorPanel } from '@/components/sections/exclusive-content-creator-panel';
import { CreatorAnnouncementPanel } from '@/components/sections/creator-announcement-panel';
import { fetchCreatorAnalytics } from '@/hooks/use-creator-analytics';

export default function CreatorDashboardPage(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <CreatorDashboardPageContent />
    </Suspense>
  );
}

function CreatorDashboardPageContent(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Warm the analytics tab while the dashboard is visible. React Query
  // deduplicates this with the analytics page if navigation happens during
  // the request, and the five-minute analytics policy keeps it fresh.
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ['creatorAnalytics', username, '30d', undefined, undefined],
      queryFn: () => fetchCreatorAnalytics(username, { preset: '30d' }),
    });
  }, [queryClient, username]);

  const { balance, loading: balanceLoading, error: balanceError } = useCreatorBalance(username);
  const {
    transactions,
    total,
    page,
    pageSize,
    goToPage,
    setPageSize,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactionHistory(username, 1, 20);
  const {
    filters,
    setFilter,
    resetFilters,
    filteredTransactions,
    exportToCsv,
    exportToExcel,
    exportToPdf,
  } = useTransactionFilter(transactions);
  const {
    wallets,
    loading: walletLoading,
    disconnectWallet,
    isPending,
    actionError,
    clearActionError,
    retryAction,
  } = useWallet();
  const { isConnected: liveConnected } = useRealtimeNotifications(username);

  // Quick-action modals state (#198)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [repeatTip, setRepeatTip] = useState<{ amount: number; recipient: string } | null>(null);
  const [repeatAmount, setRepeatAmount] = useState<string>('');
  const [repeatRecipient, setRepeatRecipient] = useState<string>('');
  const [repeatMessage, setRepeatMessage] = useState<string>('');
  const [repeatSubmitting, setRepeatSubmitting] = useState(false);

  const { createTip } = useCreateTip();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const handleOpenRepeatTip = (tx: Transaction): void => {
    const recipient = tx.senderUsername || username;
    setRepeatTip({ amount: tx.amount, recipient });
    setRepeatAmount(String(tx.amount));
    setRepeatRecipient(recipient);
    setRepeatMessage(tx.message ? `Repeating tip: ${tx.message}` : '');
  };

  const handleSendRepeatTip = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const amt = parseFloat(repeatAmount);
    if (isNaN(amt) || amt <= 0) {
      notifyError('Please enter a valid tip amount.');
      return;
    }
    setRepeatSubmitting(true);
    try {
      await createTip({
        creatorId: repeatRecipient,
        amount: amt,
        message: repeatMessage || undefined,
      });
      notifySuccess(`Successfully sent tip of ${formatCurrency(amt)} to ${repeatRecipient}!`);
      setRepeatTip(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send tip';
      notifyError(msg);
    } finally {
      setRepeatSubmitting(false);
    }
  };

  // Check if user is viewing their own dashboard
  useEffect(() => {
    if (user && user.username !== username) {
      router.replace(`/creators/${username}`);
    }
  }, [user, username, router]);

  if (!user || user.username !== username) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You can only view your own dashboard.</p>
        <Link href="/creators" className="text-primary hover:underline">
          Back to Creators
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b pb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage earnings, transactions, and wallet</p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium mt-1 ${
            liveConnected ? 'text-green-600' : 'text-muted-foreground'
          }`}
          title={
            liveConnected
              ? 'Connected: new tips update this page live'
              : 'Not connected: refresh to see new tips'
          }
        >
          {liveConnected ? '● Live' : '● Offline'}
        </span>
      </div>

      <PushNotificationPermissionPrompt />

      <CreatorTierBenefits totalEarnings={balance?.totalEarnings ?? 0} />

      <SubscriptionManagement creatorId={username} />
      <TipTierSettings creatorId={username} />
      <ScheduledTipsDashboard creatorId={username} />
      <CreatorCollaborations username={username} userId={user.id} userName={user.name} />
      <CreatorCommissionRequests username={username} userId={user.id} userName={user.name} />
      <ExclusiveContentCreatorPanel creatorId={username} />
      <CreatorAnnouncementPanel creatorId={username} />

      <section
        aria-labelledby="creator-verification-heading"
        className="border rounded-lg p-4 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="creator-verification-heading" className="font-semibold">
              Creator verification
            </h2>
            <p className="text-sm text-muted-foreground">
              Your verification status is shown to supporters on your public profile.
            </p>
          </div>
          <CreatorVerificationBadge
            verified={Boolean(user.verified)}
            status={user.verificationStatus ?? (user.verified ? 'verified' : 'unverified')}
            verifiedAt={user.verifiedAt}
            verificationType={user.verificationType}
            verificationReason={user.verificationReason}
            showDetails
            showUnverified
          />
        </div>
      </section>

      {/* Earnings Overview Cards */}
      {balanceError && !balanceLoading && (
        <div
          className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700"
          role="alert"
        >
          Unable to load earnings: {balanceError?.message || 'Unknown error'}
        </div>
      )}
      {balanceLoading ? (
        <section className="grid md:grid-cols-3 gap-6">
          <EarningsCardSkeleton />
          <EarningsCardSkeleton />
          <EarningsCardSkeleton />
        </section>
      ) : (
        <section className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Total Earnings */}
          <div className="bg-background border rounded-lg p-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
            <p className="text-3xl font-bold">{formatCurrency(balance?.totalEarnings || 0)}</p>
            <p className="text-xs text-green-600">All-time earnings</p>
          </div>

          {/* Available Balance */}
          <div className="bg-background border rounded-lg p-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Available Balance</h3>
            <p className="text-3xl font-bold">{formatCurrency(balance?.availableBalance || 0)}</p>
            <p className="text-xs text-muted-foreground">Ready to withdraw</p>
          </div>

          {/* Pending Balance */}
          <div className="bg-background border rounded-lg p-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Balance</h3>
            <p className="text-3xl font-bold">{formatCurrency(balance?.pendingBalance || 0)}</p>
            <p className="text-xs text-yellow-600">Confirming on blockchain</p>
          </div>
        </section>
      )}

      {/* Transaction History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <select
            aria-label="Transactions per page"
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>

        <TransactionFilterBar
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          onExport={() => exportToCsv(`${username}-transactions`)}
          onExportExcel={() => exportToExcel(`${username}-transactions`)}
          onExportPdf={() => exportToPdf(`${username} Transaction History`)}
          resultCount={filteredTransactions.length}
        />

        {/*
          Table. Mobile-first: `responsive-table` (src/app/globals.css) reflows
          each row into a stacked card below the `md` breakpoint and prints the
          column name from every cell's `data-label`. No column is removed, so
          the amount and the date stay on screen on a phone and the page never
          scrolls sideways.
        */}
        {transactionsError && !transactionsLoading && (
          <div
            className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700"
            role="alert"
          >
            Unable to load transaction history: {transactionsError?.message || 'Unknown error'}
          </div>
        )}
        {transactionsLoading && transactions.length === 0 ? (
          <TransactionTableSkeleton />
        ) : (
          <div className="border rounded-lg overflow-x-auto animate-fade-in">
            <table className="responsive-table w-full text-sm">
              <caption className="sr-only">
                Transaction history with the amount, date, sender, message, status, and
                transaction id for each entry.
              </caption>
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Date ({getUserTimezoneShort()})
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    From
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Message
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Tx ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {transactions.length === 0
                        ? 'No transactions yet'
                        : 'No transactions match the current filters'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/30 transition">
                      <td data-label="Date" className="px-4 py-3">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td data-label="Amount" className="px-4 py-3 font-semibold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td
                        data-label="From"
                        className="px-4 py-3 text-sm text-muted-foreground truncate"
                      >
                        {tx.senderUsername || `${(tx.senderId || '').slice(0, 8)}...`}
                      </td>
                      <td data-label="Message" className="px-4 py-3 min-w-56">
                        {tx.message ? (
                          <p className="max-w-xs truncate text-sm" title={tx.message}>
                            {tx.message}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td data-label="Status" className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            tx.status
                          )}`}
                        >
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                      <td
                        data-label="Tx ID"
                        className="px-4 py-3 text-xs text-muted-foreground truncate"
                      >
                        {tx.transactionHash ? (
                          <div className="space-y-1">
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary"
                              title={tx.transactionHash}
                            >
                              {tx.transactionHash.slice(0, 8)}...
                            </a>
                            <TransactionVerification
                              transactionId={tx.id}
                              transactionHash={tx.transactionHash}
                            />
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td data-label="Actions" className="px-4 py-3 text-right">
                        {/* Desktop action buttons */}
                        <div className="hidden sm:flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTx(tx)}
                            aria-label={`View details for transaction ${tx.id}`}
                          >
                            View Details
                          </Button>
                          {tx.amount > 0 && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenRepeatTip(tx)}
                              aria-label={`Repeat tip of ${formatCurrency(tx.amount)}`}
                            >
                              Repeat Tip
                            </Button>
                          )}
                        </div>

                        {/* Mobile dropdown menu */}
                        <div className="sm:hidden flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                aria-label={`Actions for transaction ${tx.id}`}
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedTx(tx)}>
                                View Details
                              </DropdownMenuItem>
                              {tx.amount > 0 && (
                                <DropdownMenuItem onClick={() => handleOpenRepeatTip(tx)}>
                                  Repeat Tip
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && transactions.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / pageSize)} • Total: {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-muted transition"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }).map((_, i) => {
                const pageNum = page - 2 + i;
                if (pageNum < 1 || pageNum > Math.ceil(total / pageSize)) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded ${
                      pageNum === page
                        ? 'bg-primary text-primary-foreground'
                        : 'border hover:bg-muted'
                    } transition`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-muted transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Wallet Management Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Wallet Management</h2>

        {/* Connected Wallets */}
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Connected Wallets</h3>

          {actionError && (
            <div className="flex items-center justify-between gap-4 p-3 border border-red-200 bg-red-50 rounded text-sm text-red-700">
              <span>{actionError.message}</span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => retryAction(actionError.walletId)}
                  className="px-3 py-1 rounded border border-red-300 hover:bg-red-100 transition font-medium"
                >
                  Retry
                </button>
                <button
                  onClick={clearActionError}
                  className="px-3 py-1 text-red-500 hover:text-red-700 transition"
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {walletLoading ? (
            <p className="text-muted-foreground">Loading wallets...</p>
          ) : wallets.length === 0 ? (
            <p className="text-muted-foreground">No wallets connected yet.</p>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`flex items-center justify-between p-4 border rounded bg-muted/30 transition-opacity ${
                    isPending(wallet.id) ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{wallet.name || 'Unnamed Wallet'}</p>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {wallet.publicKey}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      void disconnectWallet(wallet.id).catch(() => {
                        // Rollback and actionError are handled by useWallet;
                        // this catch only stops the rejection from
                        // surfacing as an unhandled promise rejection.
                      });
                    }}
                    disabled={isPending(wallet.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded border border-red-200 disabled:border-gray-200 text-sm font-medium transition"
                  >
                    {isPending(wallet.id) ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Wallet Button */}
          <button
            disabled
            className="w-full px-4 py-3 mt-4 border-2 border-dashed rounded-lg text-gray-400 cursor-not-allowed text-sm font-medium"
            title="Add wallet functionality coming soon"
          >
            + Add New Wallet
          </button>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid md:grid-cols-2 gap-6 py-8 border-t">
        <div className="space-y-2">
          <h3 className="font-semibold text-muted-foreground">Recent Activity</h3>
          <p className="text-3xl font-bold">
            {transactions.filter((t) => t.status === 'confirmed').length}
          </p>
          <p className="text-sm text-muted-foreground">Confirmed tips this month</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-muted-foreground">Connected Wallets</h3>
          <p className="text-3xl font-bold">{wallets.length}</p>
          <p className="text-sm text-muted-foreground">Active payment destinations</p>
        </div>
      </section>

      {/* Action Links */}
      <div className="flex gap-4 pt-4">
        <Link
          href={`/creators/${username}`}
          className="px-6 py-2 border rounded-lg hover:bg-muted transition"
        >
          View Public Profile
        </Link>
        <Link
          href="/creators"
          className="px-6 py-2 text-muted-foreground hover:text-foreground transition"
        >
          Back to Creators
        </Link>
      </div>

      {/* Transaction Details Modal */}
      <Modal open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Transaction Details</ModalTitle>
            <ModalDescription>
              Detailed information for transaction {selectedTx?.id}
            </ModalDescription>
          </ModalHeader>
          {selectedTx && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-base">{formatCurrency(selectedTx.amount)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                    selectedTx.status
                  )}`}
                >
                  {selectedTx.status.charAt(0).toUpperCase() + selectedTx.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">From</span>
                <span>{selectedTx.senderUsername || selectedTx.senderId || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Date ({getUserTimezoneShort()})</span>
                <span>{formatDateTime(selectedTx.createdAt)}</span>
              </div>
              {selectedTx.message && (
                <div className="border-b pb-2">
                  <span className="text-muted-foreground block mb-1">Message</span>
                  <p className="bg-muted p-2 rounded text-xs">{selectedTx.message}</p>
                </div>
              )}
              {selectedTx.transactionHash && (
                <div className="pt-1">
                  <span className="text-muted-foreground block mb-1">Stellar Transaction Hash</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all"
                  >
                    {selectedTx.transactionHash}
                  </a>
                </div>
              )}
            </div>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setSelectedTx(null)}>
              Close
            </Button>
            {selectedTx && selectedTx.amount > 0 && (
              <Button
                variant="default"
                onClick={() => {
                  const tx = selectedTx;
                  setSelectedTx(null);
                  handleOpenRepeatTip(tx);
                }}
              >
                Repeat Tip
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Repeat Tip Modal */}
      <Modal open={!!repeatTip} onOpenChange={(open) => !open && setRepeatTip(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Repeat Tip</ModalTitle>
            <ModalDescription>
              Pre-filled tip details from previous transaction
            </ModalDescription>
          </ModalHeader>
          <form onSubmit={handleSendRepeatTip} className="space-y-4 py-2">
            <div>
              <label htmlFor="repeat-recipient" className="block text-sm font-medium mb-1">
                Recipient
              </label>
              <Input
                id="repeat-recipient"
                value={repeatRecipient}
                onChange={(e) => setRepeatRecipient(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="repeat-amount" className="block text-sm font-medium mb-1">
                Amount (USD)
              </label>
              <Input
                id="repeat-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={repeatAmount}
                onChange={(e) => setRepeatAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="repeat-message" className="block text-sm font-medium mb-1">
                Message (Optional)
              </label>
              <Input
                id="repeat-message"
                value={repeatMessage}
                onChange={(e) => setRepeatMessage(e.target.value)}
                placeholder="Add a nice note..."
              />
            </div>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRepeatTip(null)}
                disabled={repeatSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={repeatSubmitting}>
                {repeatSubmitting ? 'Sending...' : `Send ${formatCurrency(Number(repeatAmount) || 0)}`}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
