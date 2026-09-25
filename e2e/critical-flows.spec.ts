import { expect, test, type Page } from '@playwright/test';


async function mockBackend(page: Page): Promise<void> {
  await page.route('http://localhost:5000/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/creators/demo')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'creator-demo',
          userId: 'u1',
          username: 'demo',
          displayName: 'Demo Creator',
          bio: 'Independent creator testing tips.',
          verified: true,
          verificationStatus: 'verified',
          isPublic: true,
          totalEarnings: 1200,
          pendingBalance: 45,
          createdAt: '2026-09-01T00:00:00.000Z',
        }),
      });
      return;
    }

    if (url.includes('/wallet')) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ wallets: [] }) });
      return;
    }

    if (url.includes('/transaction')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ transactions: [], total: 0, page: 1, pageSize: 20 }),
      });
      return;
    }

    if (url.includes('/earning') || url.includes('/balance')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ totalEarnings: 1200, availableBalance: 940, pendingBalance: 45 }),
      });
      return;
    }

    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({}) });
  });
}

async function mockCreatorAnalytics(page: Page): Promise<void> {
  await page.route('**/api/creators/*/analytics**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        range: '30d',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        summary: {
          totalEarnings: 1845.5,
          earningsThisMonth: 620.25,
          earningsThisWeek: 144.75,
          totalTips: 38,
        },
        earningsTrend: [
          { date: '2026-09-28', amount: 42.5 },
          { date: '2026-09-29', amount: 74 },
          { date: '2026-09-30', amount: 28.25 },
        ],
        sourceBreakdown: [
          { source: 'Profile page', amount: 420.25, count: 18 },
          { source: 'Shared link', amount: 200, count: 20 },
        ],
        topTippers: [
          { id: 'tipper-1', name: 'Maya Chen', totalAmount: 300, tipCount: 6, lastTipAt: '2026-09-30T00:00:00.000Z' },
          { id: 'tipper-2', name: 'Jonas K.', totalAmount: 180, tipCount: 4, lastTipAt: '2026-09-29T00:00:00.000Z' },
        ],
      }),
    });
  });
}

test.describe('critical frontend flows', () => {
  test('signup validates required account fields', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/invalid email address/i)).toBeVisible();
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('tip creation supports optional messages, emoji insertion, and moderation', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/creators/demo');

    await page.getByRole('button', { name: /send a tip/i }).first().click();
    await page.getByRole('button', { name: '$5' }).click();
    await page.getByLabel(/message/i).fill('Love this work');
    await page.getByRole('button', { name: /add .* emoji/i }).first().click();

    await expect(page.getByLabel(/message/i)).toHaveValue(/Love this work/);

    await page.getByLabel(/message/i).fill('spam');
    await expect(page.getByText(/flagged language/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  test('creator analytics renders charts, custom range controls, and export action', async ({ page }) => {
    await mockBackend(page);
    await mockCreatorAnalytics(page);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'Dorisio-auth',
        JSON.stringify({ state: { user: { id: 'u1', username: 'demo', role: 'creator' }, isAuthenticated: true }, version: 0 })
      );
    });

    await page.goto('/creators/demo/analytics');

    await expect(page.getByRole('heading', { name: /creator analytics/i })).toBeVisible();
    await expect(page.getByText(/earnings trend/i)).toBeVisible();
    await page.getByRole('button', { name: /custom/i }).click();
    await expect(page.getByLabel(/analytics start date/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /export csv/i })).toBeEnabled();
  });

  test('wallet settings flow exposes default wallet empty state on mobile and desktop', async ({ page }) => {
    await mockBackend(page);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'Dorisio-auth',
        JSON.stringify({ state: { user: { id: 'u1', username: 'demo', role: 'creator' }, isAuthenticated: true }, version: 0 })
      );
    });

    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await expect(page.getByText(/connect a wallet to set a default/i)).toBeVisible();
  });
});
