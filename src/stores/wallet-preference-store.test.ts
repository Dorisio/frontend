import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletPreferenceStore } from './wallet-preference-store';

describe('useWalletPreferenceStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useWalletPreferenceStore.setState({
      defaultWalletId: null,
      lastUsedWalletByCreator: {},
    });
  });

  it('starts with no default wallet and no history', () => {
    const state = useWalletPreferenceStore.getState();
    expect(state.defaultWalletId).toBeNull();
    expect(state.lastUsedWalletByCreator).toEqual({});
  });

  it('sets and persists a default wallet id', () => {
    useWalletPreferenceStore.getState().setDefaultWalletId('wallet-1');
    expect(useWalletPreferenceStore.getState().defaultWalletId).toBe('wallet-1');
  });

  it('records the last used wallet per creator independently', () => {
    const { setLastUsedWallet } = useWalletPreferenceStore.getState();

    setLastUsedWallet('creator-a', 'wallet-1');
    setLastUsedWallet('creator-b', 'wallet-2');

    const state = useWalletPreferenceStore.getState();
    expect(state.lastUsedWalletByCreator['creator-a']).toBe('wallet-1');
    expect(state.lastUsedWalletByCreator['creator-b']).toBe('wallet-2');
  });

  it('overwrites the last used wallet for the same creator', () => {
    const { setLastUsedWallet } = useWalletPreferenceStore.getState();

    setLastUsedWallet('creator-a', 'wallet-1');
    setLastUsedWallet('creator-a', 'wallet-2');

    expect(useWalletPreferenceStore.getState().lastUsedWalletByCreator['creator-a']).toBe(
      'wallet-2'
    );
  });

  it('prefers the per-creator last-used wallet over the default', () => {
    const { setDefaultWalletId, setLastUsedWallet, getPreferredWalletId } =
      useWalletPreferenceStore.getState();

    setDefaultWalletId('wallet-default');
    setLastUsedWallet('creator-a', 'wallet-last-used');

    expect(getPreferredWalletId('creator-a')).toBe('wallet-last-used');
  });

  it('falls back to the default wallet when no per-creator history exists', () => {
    const { setDefaultWalletId, getPreferredWalletId } = useWalletPreferenceStore.getState();

    setDefaultWalletId('wallet-default');

    expect(getPreferredWalletId('creator-unknown')).toBe('wallet-default');
  });

  it('returns null when there is neither a default nor per-creator history', () => {
    expect(useWalletPreferenceStore.getState().getPreferredWalletId('creator-a')).toBeNull();
  });
});
