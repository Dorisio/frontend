import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsPage from './page';

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({ wallets: [], preferredWallet: null, setDefaultWalletId: vi.fn() }),
}));

describe('SettingsPage', () => {
  it('allows profile fields to be edited and saved', async () => {
    render(<SettingsPage />);

    const displayName = screen.getByLabelText('Display Name');
    const bio = screen.getByLabelText('Creator bio');
    fireEvent.change(displayName, { target: { value: 'New Creator' } });
    fireEvent.change(bio, { target: { value: '**New bio**' } });

    expect(displayName).toHaveValue('New Creator');
    expect(bio).toHaveValue('**New bio**');
    expect(screen.getByLabelText('Bio preview')).toContainHTML('<strong>New bio</strong>');

    fireEvent.click(screen.getByRole('button', { name: 'Save Profile Settings' }));

    expect(await screen.findByText('Settings saved successfully!')).toBeInTheDocument();
  });

  it('enforces the bio limit and renders the live character indicator', () => {
    render(<SettingsPage />);

    const bio = screen.getByLabelText('Creator bio');
    fireEvent.change(bio, { target: { value: 'a'.repeat(501) } });

    expect(bio).toHaveValue('a'.repeat(500));
    expect(screen.getByText('500/500')).toBeInTheDocument();
  });

  it('clears a previous status message when the user edits a field', async () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Save Profile Settings' }));
    expect(await screen.findByText('Settings saved successfully!')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Edited' } });
    await waitFor(() => expect(screen.queryByText('Settings saved successfully!')).not.toBeInTheDocument());
  });
});
