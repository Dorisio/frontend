# Accessibility (A11y) Testing Guide

This document outlines the accessibility testing setup and practices for the Dorisio frontend application to ensure WCAG 2.1 AA compliance.

## Overview

Accessibility testing ensures our application is usable by people with disabilities. Our setup includes:
- **Automated a11y audits** using axe-core
- **Keyboard navigation testing** 
- **Screen reader compatibility** verification
- **Color contrast validation**
- **ARIA attributes** validation

## Testing Tools

### Core Dependencies
- `@axe-core/playwright` - Automated accessibility testing
- `@axe-core/cli` - Command-line accessibility audits
- `axe-core` - Core accessibility testing engine
- `@storybook/addon-a11y` - Storybook accessibility addon

### Browser Extensions (for manual testing)
- axe DevTools
- WAVE (Web Accessibility Evaluation Tool)
- Lighthouse accessibility audit

## Automated Testing

### Running A11y Tests
```bash
# Run accessibility tests with Playwright
npx playwright test --project=accessibility

# Run axe-core CLI audit
pnpm test:a11y

# Run all tests including a11y
pnpm test:e2e
```

### Test Structure
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Page accessibility scan', async ({ page }) => {
  await page.goto('/page-url');
  await page.waitForLoadState('networkidle');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## WCAG 2.1 AA Compliance

### Level A Requirements
- ✅ **1.1.1** Non-text Content: Alt text for images
- ✅ **1.3.1** Info and Relationships: Proper heading structure
- ✅ **2.1.1** Keyboard: Full keyboard accessibility
- ✅ **2.4.1** Bypass Blocks: Skip links available
- ✅ **3.3.2** Labels or Instructions: Form labels present

### Level AA Requirements  
- ✅ **1.4.3** Contrast (Minimum): 4.5:1 for normal text, 3:1 for large text
- ✅ **2.4.6** Headings and Labels: Descriptive headings
- ✅ **2.4.7** Focus Visible: Visible focus indicators
- ✅ **3.2.3** Consistent Navigation: Consistent navigation patterns

## Testing Categories

### 1. Keyboard Navigation
```typescript
test('Keyboard navigation', async ({ page }) => {
  await page.goto('/');
  
  // Test Tab navigation
  const focusableElements = await page.locator(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ).all();
  
  for (let i = 0; i < focusableElements.length; i++) {
    await page.keyboard.press('Tab');
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  }
  
  // Test Escape key functionality
  await page.keyboard.press('Escape');
  
  // Test Enter/Space for button activation
  await page.keyboard.press('Enter');
});
```

### 2. Screen Reader Compatibility
```typescript
test('Screen reader compatibility', async ({ page }) => {
  await page.goto('/');
  
  // Verify heading structure (h1 → h2 → h3)
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  expect(headings.length).toBeGreaterThan(0);
  
  // Check for alt text on images
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const ariaLabel = await img.getAttribute('aria-label');
    expect(alt !== null || ariaLabel !== null).toBe(true);
  }
  
  // Verify form labels
  const inputs = await page.locator('input, textarea, select').all();
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    
    if (id) {
      const label = await page.locator(`label[for="${id}"]`).count();
      expect(label > 0 || ariaLabel !== null).toBe(true);
    }
  }
});
```

### 3. Color Contrast
```typescript
test('Color contrast compliance', async ({ page }) => {
  await page.goto('/');
  
  const contrastResults = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .withRules(['color-contrast'])
    .analyze();
    
  expect(contrastResults.violations).toEqual([]);
});
```

### 4. Focus Management
```typescript
test('Focus indicators visible', async ({ page }) => {
  await page.goto('/');
  
  const focusableElements = await page.locator('button, a, input').all();
  
  for (const element of focusableElements.slice(0, 5)) {
    await element.focus();
    
    const focusStyle = await element.evaluate((el) => {
      const styles = window.getComputedStyle(el, ':focus');
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });
    
    // Ensure visible focus indicator
    expect(
      focusStyle.outline !== 'none' || 
      focusStyle.outlineWidth !== '0px' ||
      focusStyle.boxShadow !== 'none'
    ).toBe(true);
  }
});
```

## Manual Testing Checklist

### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)  
- [ ] Test with VoiceOver (macOS)
- [ ] Test with TalkBack (Android)
- [ ] Test with VoiceOver (iOS)

### Keyboard Testing
- [ ] Tab through all interactive elements
- [ ] Shift+Tab for reverse navigation
- [ ] Enter/Space activate buttons and links
- [ ] Escape closes modals/menus
- [ ] Arrow keys navigate within components

### Visual Testing
- [ ] 400% zoom level usability
- [ ] High contrast mode compatibility
- [ ] Dark mode accessibility
- [ ] Reduced motion preferences respected

## Common A11y Issues and Solutions

### Issue: Missing Alt Text
```html
<!-- ❌ Bad -->
<img src="chart.png" />

<!-- ✅ Good -->
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2" />

<!-- ✅ Decorative -->
<img src="decoration.png" alt="" role="presentation" />
```

### Issue: Poor Color Contrast
```css
/* ❌ Bad - 2.1:1 ratio */
.text { color: #999; background: #fff; }

/* ✅ Good - 4.7:1 ratio */  
.text { color: #666; background: #fff; }
```

### Issue: Missing Form Labels
```html
<!-- ❌ Bad -->
<input type="email" placeholder="Email" />

<!-- ✅ Good -->
<label for="email">Email Address</label>
<input type="email" id="email" />

<!-- ✅ Also Good -->
<input type="email" aria-label="Email Address" />
```

### Issue: Inaccessible Focus
```css
/* ❌ Bad */
button:focus { outline: none; }

/* ✅ Good */
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Accessibility Tests
  run: |
    npx playwright test --project=accessibility
    pnpm test:a11y
    
- name: Upload A11y Report
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: accessibility-report
    path: test-results/
```

### Quality Gates
- **Zero critical violations** before merge
- **<10 total violations** in baseline
- **All new components** must pass a11y tests
- **Regression prevention** via automated checks

## Monitoring and Reporting

### Metrics to Track
- Number of accessibility violations over time
- WCAG compliance percentage
- Screen reader compatibility score
- Keyboard navigation coverage

### Regular Audits
- Weekly automated scans
- Monthly manual testing
- Quarterly comprehensive audit
- Annual WCAG compliance review

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/4.7)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

### Tools
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Testing Services
- [Screen Reader User Testing](https://www.usertesting.com/)
- [Accessibility Auditing Services](https://www.deque.com/services/)
- [Automated A11y Monitoring](https://www.accessibe.com/)

## Storybook Integration

Our Storybook setup includes the a11y addon for component-level testing:

```javascript
// .storybook/main.ts
export default {
  addons: [
    '@storybook/addon-a11y',
    // other addons
  ],
};
```

This provides real-time accessibility feedback during component development.