import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGE_SIZE = 20;
const TOTAL_CREATORS = 25;

function buildCreators(count = TOTAL_CREATORS) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return {
      id: `creator-${n}`,
      userId: `user-${n}`,
      username: `creator-${n}`,
      displayName: `Creator ${n}`,
      bio: `Bio for creator ${n}`,
      avatar: `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&sig=${n}`,
      verified: n % 2 === 0,
      verificationStatus: n % 2 === 0 ? 'verified' : undefined,
      isPublic: true,
      totalEarnings: 1000 + n * 100,
      pendingBalance: 0,
      category: n % 2 === 0 ? 'Art' : 'Music',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
  });
}

const creators = buildCreators();

function creatorLink(n: number) {
  return `a[href="/creators/creator-${n}"]`;
}

test.describe('Creator Discovery Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'Dorisio-auth',
        JSON.stringify({
          state: {
            user: { id: 'user-a11y', username: 'a11y-tester', role: 'fan' },
            token: 'a11y-test-token',
            isAuthenticated: true,
          },
          version: 0,
        })
      );
    });

    await page.route('**/api/v1/creators', async (route) => {
      const url = new URL(route.request().url());
      const pageNum = Number(url.searchParams.get('page')) || 1;
      const pageSize = Number(url.searchParams.get('pageSize')) || PAGE_SIZE;
      const verified = url.searchParams.get('verified');
      const filtered = verified === 'true' ? creators.filter((c) => c.verified) : creators;
      const start = (pageNum - 1) * pageSize;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            creators: filtered.slice(start, start + pageSize),
            total: filtered.length,
            page: pageNum,
            pageSize,
          },
        }),
      });
    });

    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.goto('/creators');
    await page.waitForLoadState('networkidle');
  });

  test('axe accessibility scan passes with no WCAG AA violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation works end to end through filters, creator list, and pagination', async ({
    page,
  }) => {
    // First Tab stop is the search combobox.
    await page.keyboard.press('Tab');
    const search = page.getByRole('combobox', { name: 'Search creators' });
    await expect(search).toBeFocused();

    // Every Tab stop lands on a visible focusable element (no focus trapped off-screen).
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }

    // Creator card links are reachable and focusable by keyboard.
    const card20 = page.locator(creatorLink(20));
    await card20.focus();
    await expect(card20).toBeFocused();
    await expect(page.getByRole('heading', { name: /^Creator 20$/, level: 3 })).toBeVisible();

    // Pagination: Page 2 exists since there are 25 creators.
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    const nextButton = page.getByRole('button', { name: /^Next →$/ });
    await nextButton.focus();
    await expect(nextButton).toBeFocused();
    await nextButton.press('Enter');
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(page.locator(creatorLink(21))).toBeVisible();

    const prevButton = page.getByRole('button', { name: /^← Prev$/ });
    await prevButton.focus();
    await expect(prevButton).toBeFocused();
    await prevButton.press('Enter');
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });

  test('search by keyboard filters results', async ({ page }) => {
    await page.keyboard.press('Tab');
    const search = page.getByRole('combobox', { name: 'Search creators' });
    await expect(search).toBeFocused();

    // Search is client-side over the fetched first page (creators 1-20).
    await search.type('Creator 20', { delay: 50 });
    await expect(page.getByText('Showing 1 creator')).toBeVisible();
    await expect(page.locator(creatorLink(20))).toBeVisible();
    await expect(page.locator(creatorLink(1))).not.toBeVisible();
  });

  test('screen reader announces creator names, filter options, and pagination', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Discover Creators' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Search creators' })).toBeVisible();

    await expect(page.getByRole('checkbox', { name: 'Verified only' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: /Min earnings/ })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: /Max earnings/ })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Sort by/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

    await expect(page.getByRole('region', { name: 'Creator filters' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Category/ })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Verified creators' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();

    await expect(page.getByRole('option', { name: 'All categories' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Art' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Music' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Trending' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Earnings' })).toBeVisible();

    // Creator names announced via headings within each card.
    await expect(page.getByRole('heading', { name: /^Creator 1$/, level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Creator 20$/, level: 3 })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /^Creator 25$/, level: 3 })
    ).not.toBeVisible(); // page 1 only

    await expect(page.getByRole('img', { name: /^Creator 1$/ })).toBeVisible();

    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: /^← Prev$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Next →$/ })).toBeVisible();

    await page.getByRole('combobox', { name: 'Search creators' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: /^Alice Cooper$/ })).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
