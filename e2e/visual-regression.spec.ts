import { expect, test, type Page } from '@playwright/test';

async function mockVisualData(page: Page): Promise<void> {
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
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ wallets: [] }),
      });
      return;
    }

    if (url.includes('/transaction')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: [
            {
              id: 'tx-1',
              amount: 15,
              status: 'confirmed',
              createdAt: '2026-09-26T12:00:00.000Z',
              senderUsername: 'maya',
              message: 'Great work',
              transactionHash: 'abc123456789',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
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
          {
            id: 'tipper-1',
            name: 'Maya Chen',
            totalAmount: 300,
            tipCount: 6,
            lastTipAt: '2026-09-30T00:00:00.000Z',
          },
        ],
      }),
    });
  });
}

async function authenticateCreator(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'Dorisio-auth',
      JSON.stringify({
        state: {
          user: { id: 'u1', username: 'demo', role: 'creator' },
          isAuthenticated: true,
        },
        version: 0,
      })
    );
  });
}

test.describe('visual regression coverage', () => {
  test.beforeEach(async ({ page }) => {
    await mockVisualData(page);
    await authenticateCreator(page);
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('creator analytics dashboard remains visually stable', async ({ page }) => {
    await page.goto('/creators/demo/analytics');
    await expect(page.getByRole('heading', { name: /creator analytics/i })).toBeVisible();
    await expect(page).toHaveScreenshot('creator-analytics.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('creator transaction dashboard remains visually stable', async ({ page }) => {
    await page.goto('/creators/demo/dashboard');
    await expect(page.getByRole('heading', { name: /creator dashboard/i })).toBeVisible();
    await expect(page).toHaveScreenshot('creator-dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
