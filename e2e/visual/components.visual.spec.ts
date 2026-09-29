import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests - Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Button Components', async ({ page }) => {
    // Navigate to a page with buttons or create test page
    // This is a placeholder - adjust based on your actual routes
    await page.goto('/components/buttons');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Button Components');
  });

  test('Form Components', async ({ page }) => {
    // Navigate to a page with forms
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Form Components');
  });

  test('Navigation Components', async ({ page }) => {
    // Test navigation in different states
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Test mobile menu if available
    await page.setViewportSize({ width: 375, height: 667 });
    
    await percySnapshot(page, 'Navigation - Mobile');
  });

  test('Modal Components', async ({ page }) => {
    // Trigger modal if available
    const modalTrigger = page.locator('[data-testid="open-modal"]');
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForSelector('[data-testid="modal"]');
      
      await percySnapshot(page, 'Modal Component');
    }
  });
});