import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatorSearchBar, RECENT_SEARCHES_KEY } from './creator-search-bar';
import type { CreatorSearchFilters } from '@/hooks/use-creator-search';
import type { Creator } from '@/types';

const baseFilters: CreatorSearchFilters = {
  category: '',
  search: '',
  verifiedOnly: false,
  minEarnings: '',
  maxEarnings: '',
  sort: 'trending',
  page: 1,
};

const testCreators: Creator[] = [
  {
    id: 'test-1',
    userId: 'u-1',
    username: 'alice',
    displayName: 'Alice Cooper',
    bio: 'Digital artist',
    avatar: 'https://example.com/alice.jpg',
    verified: true,
    verificationStatus: 'verified',
    isPublic: true,
    totalEarnings: 5000,
    pendingBalance: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'test-2',
    userId: 'u-2',
    username: 'bob',
    displayName: 'Bob Builder',
    bio: 'Software engineer',
    avatar: '',
    verified: false,
    isPublic: true,
    totalEarnings: 3000,
    pendingBalance: 50,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'test-3',
    userId: 'u-3',
    username: 'carol',
    displayName: 'Carol Danvers',
    bio: 'Pilot & hero',
    avatar: '',
    verified: true,
    verificationStatus: 'verified',
    isPublic: true,
    totalEarnings: 8000,
    pendingBalance: 200,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

describe('CreatorSearchBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('base filter functionality', () => {
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

    it('calls onChange when minEarnings changes', () => {
      const onChange = vi.fn();
      render(<CreatorSearchBar filters={baseFilters} onChange={onChange} onReset={vi.fn()} />);

      fireEvent.change(screen.getByLabelText('Min earnings'), { target: { value: '50' } });
      expect(onChange).toHaveBeenCalledWith('minEarnings', '50');
    });

    it('calls onChange when maxEarnings changes', () => {
      const onChange = vi.fn();
      render(<CreatorSearchBar filters={baseFilters} onChange={onChange} onReset={vi.fn()} />);

      fireEvent.change(screen.getByLabelText('Max earnings'), { target: { value: '500' } });
      expect(onChange).toHaveBeenCalledWith('maxEarnings', '500');
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

  describe('autocomplete dropdown & suggestions', () => {
    it('opens dropdown on focus and shows trending creators when search is empty', () => {
      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);

      expect(screen.getByTestId('search-suggestions-dropdown')).toBeInTheDocument();
      expect(screen.getByText('Trending Creators')).toBeInTheDocument();
      expect(screen.getByText('Carol Danvers')).toBeInTheDocument();
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    });

    it('displays creator avatars with names and handles', () => {
      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));

      // Alice has an image avatar
      const aliceImg = screen.getByAltText('Alice Cooper');
      expect(aliceImg).toBeInTheDocument();
      expect(aliceImg).toHaveAttribute('src', 'https://example.com/alice.jpg');

      // Carol has no image avatar so displays fallback initial 'C'
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('@carol')).toBeInTheDocument();
    });

    it('debounces suggestions filtering by 300ms', () => {
      vi.useFakeTimers();

      const { rerender } = render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));
      expect(screen.getByText('Trending Creators')).toBeInTheDocument();

      // Change search filter to 'bob'
      rerender(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'bob' }}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      // Before 300ms debounce expires, suggestions should not be active yet
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByText('Creators')).not.toBeInTheDocument();

      // After remaining 100ms (total 300ms), suggestions appear
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.getByText('Creators')).toBeInTheDocument();
      expect(screen.getByText('Bob Builder')).toBeInTheDocument();
      expect(screen.getByText('@bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice Cooper')).not.toBeInTheDocument();
    });

    it('shows no creators found message when query has no matches', () => {
      vi.useFakeTimers();

      render(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'nonexistent-person' }}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByText(/No creators found for “nonexistent-person”/i)).toBeInTheDocument();
    });

    it('offers a Clear search action in the empty state that resets the query', () => {
      vi.useFakeTimers();
      const onChange = vi.fn();

      render(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'nonexistent-person' }}
          onChange={onChange}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));
      act(() => {
        vi.advanceTimersByTime(300);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
      expect(onChange).toHaveBeenCalledWith('search', '');
    });

    it('does not show the empty message while the query still has matches', () => {
      vi.useFakeTimers();

      render(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'bob' }}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.queryByTestId('search-no-results')).not.toBeInTheDocument();
    });

    it('selecting a suggestion calls onChange, onSelectCreator, and closes dropdown', () => {
      vi.useFakeTimers();

      const onChange = vi.fn();
      const onSelectCreator = vi.fn();

      render(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'ali' }}
          onChange={onChange}
          onReset={vi.fn()}
          creators={testCreators}
          onSelectCreator={onSelectCreator}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const suggestion = screen.getByTestId('suggestion-item-test-1');
      fireEvent.click(suggestion);

      expect(onChange).toHaveBeenCalledWith('search', 'Alice Cooper');
      expect(onSelectCreator).toHaveBeenCalledWith(testCreators[0]);
      expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('search history (last 5 searches)', () => {
    it('displays search history from localStorage when search is empty', () => {
      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(['crypto artist', 'bob', 'podcasters'])
      );

      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('crypto artist')).toBeInTheDocument();
      expect(screen.getByText('podcasters')).toBeInTheDocument();
    });

    it('saves query to search history on Enter key press', () => {
      render(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'stellar tipping' }}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'Enter' });

      const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      expect(stored[0]).toBe('stellar tipping');
    });

    it('limits search history to maximum 5 items and avoids duplicates', () => {
      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(['one', 'two', 'three', 'four', 'five'])
      );

      render(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'six' }}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'Enter' });

      const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      expect(stored).toHaveLength(5);
      expect(stored[0]).toBe('six');
      expect(stored).toContain('one');
      expect(stored).not.toContain('five');
    });

    it('allows removing an individual search history item', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['remove-me', 'keep-me']));

      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));
      expect(screen.getByText('remove-me')).toBeInTheDocument();

      const removeBtn = screen.getByLabelText('Remove remove-me from history');
      fireEvent.click(removeBtn);

      expect(screen.queryByText('remove-me')).not.toBeInTheDocument();
      expect(screen.getByText('keep-me')).toBeInTheDocument();
    });

    it('allows clearing all recent searches', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['item-1', 'item-2']));

      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      fireEvent.focus(screen.getByLabelText('Search creators'));
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Clear'));

      expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
      expect(localStorage.getItem(RECENT_SEARCHES_KEY)).toBeNull();
    });
  });

  describe('keyboard navigation & interactions', () => {
    it('navigates through suggestions with ArrowDown and ArrowUp and selects with Enter', () => {
      vi.useFakeTimers();

      const onChange = vi.fn();
      render(
        <CreatorSearchBar
          filters={{ ...baseFilters, search: 'c' }}
          onChange={onChange}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // ArrowDown to highlight first item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const firstItem = screen.getByTestId('suggestion-item-test-1');
      expect(firstItem).toHaveAttribute('aria-selected', 'true');

      // ArrowDown to highlight second item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const secondItem = screen.getByTestId('suggestion-item-test-3');
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
      expect(firstItem).toHaveAttribute('aria-selected', 'false');

      // ArrowUp to highlight back to first item
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(firstItem).toHaveAttribute('aria-selected', 'true');

      // Enter to select highlighted item
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith('search', 'Alice Cooper');
      expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();
    });

    it('pressing ArrowDown when dropdown is closed opens it', () => {
      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(screen.getByTestId('search-suggestions-dropdown')).toBeInTheDocument();
    });

    it('navigates and selects search history items using keyboard', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['previous-query']));
      const onChange = vi.fn();

      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={onChange}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);

      // Highlight history item (first navigable item)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const historyItem = screen.getByTestId('history-item-0');
      expect(historyItem).toHaveAttribute('aria-selected', 'true');

      // Press Enter to select it
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith('search', 'previous-query');
      expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();
    });

    it('navigates and selects trending creator using keyboard', () => {
      const onChange = vi.fn();

      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={onChange}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);

      // testCreators: Carol (8000), Alice (5000), Bob (3000)
      // ArrowDown highlights first trending item (Carol)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const trendingCarol = screen.getByTestId('trending-item-test-3');
      expect(trendingCarol).toHaveAttribute('aria-selected', 'true');

      // Press Enter to select
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith('search', 'Carol Danvers');
      expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();
    });

    it('closes dropdown when Escape key is pressed', () => {
      render(
        <CreatorSearchBar
          filters={baseFilters}
          onChange={vi.fn()}
          onReset={vi.fn()}
          creators={testCreators}
        />
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);
      expect(screen.getByTestId('search-suggestions-dropdown')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', () => {
      render(
        <div>
          <div data-testid="outside-element">Outside</div>
          <CreatorSearchBar
            filters={baseFilters}
            onChange={vi.fn()}
            onReset={vi.fn()}
            creators={testCreators}
          />
        </div>
      );

      const input = screen.getByLabelText('Search creators');
      fireEvent.focus(input);
      expect(screen.getByTestId('search-suggestions-dropdown')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside-element'));
      expect(screen.queryByTestId('search-suggestions-dropdown')).not.toBeInTheDocument();
    });
  });
});
