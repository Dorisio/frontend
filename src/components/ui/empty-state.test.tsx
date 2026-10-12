import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';
import { Inbox, Plus } from 'lucide-react';
import { Button } from './button';

describe('EmptyState Component (#164)', () => {
  it('renders title and description properly', () => {
    render(
      <EmptyState
        title="No transactions yet"
        description="Send a tip or link your wallet to see your transaction history."
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    expect(
      screen.getByText('Send a tip or link your wallet to see your transaction history.')
    ).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Empty inbox"
        description="No new notifications at this time."
      />
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('Empty inbox')).toBeInTheDocument();
  });

  it('renders optional action button', () => {
    render(
      <EmptyState
        title="No items found"
        action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Create New</Button>}
      />
    );

    expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument();
  });
});
