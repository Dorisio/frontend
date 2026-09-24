import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, THEME_STORAGE_KEY } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

function renderToggle(): void {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('renders an accessible toggle button', () => {
    renderToggle();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cycles light -> dark -> system -> light on repeated clicks', async () => {
    const user = userEvent.setup();
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    renderToggle();

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Light theme'));

    await user.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Dark theme'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('System theme'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');

    await user.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Light theme'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
