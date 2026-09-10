/**
 * Creator Dashboard Page
 * Private dashboard at /creators/[username]/dashboard
 * Shows earnings overview, transaction history, and wallet management
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useCreatorBalance } from '@/hooks/use-creator-balance';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { useWallet } from '@/hooks/use-wallet';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import WalletManager from '@/components/sections/wallet-manager';
import Link from 'next/link';

interface DashboardState {
  creator: { id: string; username: string; displayName: string } | null;
  loading: boolean;
  error: string | null;
}

export default function CreatorDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState<DashboardState>({
    creator: null,
    loading: true,
    error: null,
  });
  const [walletManagerOpen, setWalletManagerOpen] = useState(false);

  const { balance, loading: balanceLoading } = useCreatorBalance(username);
  const {
    transactions,
    total,
    page,
    pageSize,
    goToPage,
    setPageSize,
    loading: historyLoading,
  } = useTransactionHistory(username);
  const { wallets, loading: walletLoading } = useWallet();

  // Check if user is viewing their own dashboard
  useEffect(() => {
    if (user && user.username !== username) {
      router.replace(`/creators/${username}`);
    }
  }, [user, username, router]);

  useEffect(() => {
    // Load creator info from username
    setState((prev) => ({
      ...prev,
      creator: {
        id: 'creator-id', // Would come from SDK
        username,
        displayName: user?.displayName || username,
      },
    }));
  }, [username, user]);

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
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
        <p className="text-muted-foreground">Manage earnings, transactions, and wallet</p>
      </div>

      {/* Earnings Overview Cards */}
      <section className="grid md:grid-cols-3 gap-6">
        {/* Total Earnings */}
        <div className="bg-background border rounded-lg p-6 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
          <p className="text-3xl font-bold">
            {balanceLoading ? '...' : formatCurrency(balance?.totalEarnings || 0)}
          </p>
          <p className="text-xs text-green-600">All-time earnings</p>
        </div>

        {/* Available Balance */}
        <div className="bg-background border rounded-lg p-6 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Available Balance</h3>
          <p className="text-3xl font-bold">
            {balanceLoading ? '...' : formatCurrency(balance?.availableBalance || 0)}
          </p>
          <p className="text-xs text-muted-foreground">Ready to withdraw</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-background border rounded-lg p-6 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Balance</h3>
          <p className="text-3xl font-bold">
            {balanceLoading ? '...' : formatCurrency(balance?.pendingBalance || 0)}
          </p>
          <p className="text-xs text-yellow-600">Confirming on blockchain</p>
        </div>
      </section>

      {/* Transaction History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <select
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">From</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Tx ID</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {balanceLoading ? 'Loading transactions...' : 'No transactions yet'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/30 transition">
                    <td className="px-4 py-3">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate">
                      {tx.senderUsername || `${tx.senderId.slice(0, 8)}...`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          tx.status
                        )}`}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground truncate">
                      {tx.transactionHash ? (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                          title={tx.transactionHash}
                        >
                          {tx.transactionHash.slice(0, 8)}...
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

          {walletLoading ? (
            <p className="text-muted-foreground">Loading wallets...</p>
          ) : wallets.length === 0 ? (
            <p className="text-muted-foreground">No wallets connected yet.</p>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 border rounded bg-muted/30"
                >
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{wallet.name || 'Unnamed Wallet'}</p>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {wallet.publicKey}
                    </p>
                  </div>
                  <button
                    onClick={() => setWalletManagerOpen(true)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded border border-red-200 transition text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Wallet Button */}
          <button
            onClick={() => setWalletManagerOpen(true)}
            className="w-full px-4 py-3 mt-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition font-medium text-primary"
          >
            + Add New Wallet
          </button>
        </div>
      </section>

      {/* Wallet Manager Modal */}
      <WalletManager isOpen={walletManagerOpen} onClose={() => setWalletManagerOpen(false)} />

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
    </div>
  );
}
