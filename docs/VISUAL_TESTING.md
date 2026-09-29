# Visual Regression Testing Guide

This document outlines the visual regression testing setup using Percy and Playwright for the Dorisio frontend application.

## Overview

Visual regression testing helps catch UI changes that could break layouts or design consistency. Our setup uses:
- **Percy** for visual diff generation and baseline management
- **Playwright** for screenshot capture across browsers and devices
- **Automated CI/CD integration** for continuous monitoring

## Setup

### Prerequisites
1. Percy account and project token
2. Node.js 20+ and pnpm installed
3. Playwright browsers installed

### Configuration Files
- `.percy.yml` - Percy configuration for snapshot settings
- `playwright-visual.config.ts` - Playwright config for visual tests
- `e2e/visual/` - Visual test files

## Running Visual Tests

### Local Development
```bash
# Install dependencies
pnpm install

# Run visual tests with Percy
pnpm test:visual

# Run without Percy (local screenshots only)
npx playwright test --config=playwright-visual.config.ts
```

### CI/CD Pipeline
Visual tests run automatically on:
- Pull requests to main/develop branches
- Push to main branch
- Scheduled runs (daily)

## Writing Visual Tests

### Basic Structure
```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('Component visual test', async ({ page }) => {
  await page.goto('/component-page');
  await page.waitForLoadState('networkidle');
  
  // Hide dynamic content
  await page.addStyleTag({
    content: `
      .timestamp, [data-testid="dynamic-content"] {
        visibility: hidden !important;
      }
    `
  });
  
  await percySnapshot(page, 'Component Name - State');
});
```

### Best Practices

1. **Stable Elements**: Hide or mock dynamic content (timestamps, random IDs)
2. **Wait for Loading**: Use `waitForLoadState('networkidle')` before snapshots
3. **Consistent Naming**: Use descriptive names like "Component - State - Device"
4. **Multiple States**: Test different component states (loading, error, success)
5. **Responsive Design**: Test across different viewport sizes

### Handling Dynamic Content

```typescript
// Hide dynamic elements
await page.addStyleTag({
  content: `
    [data-testid="timestamp"],
    .loading-spinner,
    .random-id {
      visibility: hidden !important;
    }
  `
});

// Mock API responses
await page.route('/api/dynamic-data', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'stable-test-data' })
  });
});
```

## Reviewing Visual Changes

### Percy Dashboard
1. Visit Percy dashboard after test runs
2. Review visual diffs between baseline and current
3. Approve or reject changes
4. New baselines are created when changes are approved

### Diff Thresholds
- **0.1%**: Sensitive threshold for critical UI components
- **0.5%**: Standard threshold for general components
- **1.0%**: Relaxed threshold for less critical areas

## Troubleshooting

### Common Issues

1. **Flaky Tests**: Usually caused by dynamic content or animations
   - Solution: Hide dynamic elements or wait for animations to complete

2. **Font Rendering Differences**: Different OS/browser combinations
   - Solution: Use web fonts or normalize font stacks in Percy CSS

3. **Loading States**: Screenshots taken before content loads
   - Solution: Use proper wait conditions and loading indicators

### Debug Mode
```bash
# Run with headed browser to see what's happening
npx playwright test --config=playwright-visual.config.ts --headed

# Generate trace files for debugging
npx playwright test --config=playwright-visual.config.ts --trace on
```

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Visual Tests
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
  run: pnpm test:visual
```

### Environment Variables
- `PERCY_TOKEN`: Percy project token (required for CI)
- `PERCY_BRANCH`: Override branch name for Percy
- `PERCY_TARGET_BRANCH`: Base branch for comparisons

## Monitoring and Metrics

### Key Metrics
- **Visual Change Detection Rate**: Percentage of UI changes caught
- **False Positive Rate**: Flaky tests requiring investigation
- **Review Time**: Time to review and approve visual changes
- **Coverage**: Percentage of components with visual tests

### Reporting
- Percy dashboard provides change history and statistics
- CI logs include Percy build URLs for quick access
- Slack notifications for visual changes (if configured)

## Maintenance

### Baseline Updates
- Baselines auto-update when changes are approved in Percy
- Manual baseline updates possible via Percy CLI
- Regular baseline cleanup for obsolete test cases

### Test Organization
```
e2e/visual/
├── homepage.visual.spec.ts
├── components.visual.spec.ts
├── forms.visual.spec.ts
└── navigation.visual.spec.ts
```

## Resources

- [Percy Documentation](https://docs.percy.io/)
- [Playwright Visual Testing](https://playwright.dev/docs/test-screenshots)
- [Visual Testing Best Practices](https://docs.percy.io/docs/visual-testing-best-practices)