import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionFilterBar } from './transaction-filter-bar';
import type { TransactionFilterState } from '@/hooks/use-transaction-filter';

const baseFilters: TransactionFilterState = {
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  status: 'all',
  sortField: 'date',
  sortDirection: 'desc',
};

describe('TransactionFilterBar', () => {
  it('renders all filter controls', () => {
    render(
      <TransactionFilterBar
        filters={baseFilters}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onExport={vi.fn()}
        resultCount={0}
      />
    );

    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
    expect(screen.getByLabelText('Min amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Max amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
    expect(screen.getByLabelText('Order')).toBeInTheDocument();
  });

  it('calls onChange with the field key and new value when a filter changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TransactionFilterBar
        filters={baseFilters}
        onChange={onChange}
        onReset={vi.fn()}
        onExport={vi.fn()}
        resultCount={0}
      />
    );

    await user.selectOptions(screen.getByLabelText('Status'), 'confirmed');
    expect(onChange).toHaveBeenCalledWith('status', 'confirmed');
  });

  it('calls onReset when the Reset button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
      <TransactionFilterBar
        filters={baseFilters}
        onChange={vi.fn()}
        onReset={onReset}
        onExport={vi.fn()}
        resultCount={0}
      />
    );

    await user.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('shows the result count on the export button and disables it when there are no results', () => {
    render(
      <TransactionFilterBar
        filters={baseFilters}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onExport={vi.fn()}
        resultCount={0}
      />
    );

    const exportButton = screen.getByText(/Export CSV \(0\)/);
    expect((exportButton.closest('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables the export button and calls onExport when there are results', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <TransactionFilterBar
        filters={baseFilters}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onExport={onExport}
        resultCount={5}
      />
    );

    const exportButton = screen.getByText(/Export CSV \(5\)/).closest('button');
    expect((exportButton as HTMLButtonElement).disabled).toBe(false);

    await user.click(exportButton as HTMLButtonElement);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
