import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Homepage - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Hide dynamic elements that could cause flaky tests
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        .timestamp,
        .loading-spinner {
          visibility: hidden !important;
        }
      `
    });

    // Take Percy snapshot
    await percySnapshot(page, 'Homepage - Desktop');
  });

  test('Homepage - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        .timestamp,
        .loading-spinner {
          visibility: hidden !important;
        }
      `
    });

    // Take Percy snapshot
    await percySnapshot(page, 'Homepage - Mobile');
  });

  test('Homepage - Dark Mode', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Enable dark mode if available
    await page.evaluate(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Take Percy snapshot
    await percySnapshot(page, 'Homepage - Dark Mode');
  });
});