import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatorSearchBar } from './creator-search-bar';
import type { CreatorSearchFilters } from '@/hooks/use-creator-search';

const baseFilters: CreatorSearchFilters = {
  search: '',
  verifiedOnly: false,
  minEarnings: '',
  maxEarnings: '',
  sort: 'trending',
  page: 1,
};

describe('CreatorSearchBar', () => {
  it('renders the search input and all filter controls', () => {
    render(<CreatorSearchBar filters={baseFilters} onChange={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByLabelText('Search creators')).toBeInTheDocument();
    expect(screen.getByText('Verified only')).toBeInTheDocument();
    expect(screen.getByLabelText('Min earnings')).toBeInTheDocument();
    expect(screen.getByLabelText('Max earnings')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('calls onChange with each keystroke in the search box', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatorSearchBar filters={baseFilters} onChange={onChange} onReset={vi.fn()} />);

    await user.type(screen.getByLabelText('Search creators'), 'a');
    expect(onChange).toHaveBeenCalledWith('search', 'a');
  });

  it('calls onChange when the verified checkbox is toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatorSearchBar filters={baseFilters} onChange={onChange} onReset={vi.fn()} />);

    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith('verifiedOnly', true);
  });

  it('calls onChange when the sort option changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatorSearchBar filters={baseFilters} onChange={onChange} onReset={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'alphabetical');
    expect(onChange).toHaveBeenCalledWith('sort', 'alphabetical');
  });

  it('calls onReset when the Reset button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<CreatorSearchBar filters={baseFilters} onChange={vi.fn()} onReset={onReset} />);

    await user.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
