/**
 * Wallet Selector
 * Dropdown for choosing which connected wallet to tip from, showing balance
 * per option. Used in the tip flow before confirmation.
 */

'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Check, Wallet as WalletIcon } from 'lucide-react';
import { useWallet, type WalletInfo } from '@/hooks/use-wallet';

export interface WalletSelectorProps {
  /** Currently selected wallet id. */
  value: string | null;
  /** Called with the newly selected wallet id. */
  onChange: (walletId: string) => void;
  disabled?: boolean;
}

function formatBalance(wallet: WalletInfo): string {
  if (!wallet.balance) return '';
  return `$${wallet.balance.available.toFixed(2)}`;
}

export function WalletSelector({ value, onChange, disabled }: WalletSelectorProps): JSX.Element {
  const { wallets, getBalance } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [balances, setBalances] = useState<Record<string, WalletInfo['balance']>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadBalances(): Promise<void> {
      for (const wallet of wallets) {
        try {
          const balance = await getBalance(wallet.id);
          if (!cancelled) {
            setBalances((prev) => ({ ...prev, [wallet.id]: balance }));
          }
        } catch {
          // Balance is a non-critical UI enhancement; leave it blank on failure.
        }
      }
    }

    if (wallets.length > 0) {
      loadBalances();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.map((w) => w.id).join(',')]);

  const walletsWithBalance: WalletInfo[] = wallets.map((wallet) => ({
    ...wallet,
    balance: balances[wallet.id],
  }));

  const selected = walletsWithBalance.find((w) => w.id === value) ?? null;

  if (wallets.length === 0) {
    return (
      <div className="text-sm" style={{ color: 'var(--muted)' }}>
        No wallets connected
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="input-dark w-full flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select wallet to tip from"
      >
        <span className="flex items-center gap-2 min-w-0">
          <WalletIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {selected
              ? selected.name || `Wallet ${selected.publicKey.slice(0, 8)}...`
              : 'Select a wallet'}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {selected && formatBalance(selected) && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {formatBalance(selected)}
            </span>
          )}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border shadow-lg max-h-60 overflow-auto"
          style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--hairline)' }}
        >
          {walletsWithBalance.map((wallet) => (
            <li key={wallet.id} role="option" aria-selected={wallet.id === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(wallet.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-smooth"
                style={{ color: 'var(--on-dark)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {wallet.id === value && <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />}
                  <span className="truncate">
                    {wallet.name || `Wallet ${wallet.publicKey.slice(0, 8)}...`}
                  </span>
                </span>
                {formatBalance(wallet) && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>
                    {formatBalance(wallet)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
