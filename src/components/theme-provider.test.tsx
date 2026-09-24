import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from './theme-provider';

function mockMatchMedia(prefersDark: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: prefersDark,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function Consumer(): JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    mockMatchMedia(false);
  });

  it('provides theme context to children without throwing', () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toBeInTheDocument();
  });

  it('defaults to system theme and resolves it from the OS preference', async () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('theme').textContent).toBe('system'));
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reads a previously stored theme preference on mount', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('theme').textContent).toBe('light'));
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('switches themes, updates the document class, and persists to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    await user.click(screen.getByText('dark'));

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByText('light'));

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('resolves system theme back to the OS preference when reselected', async () => {
    const user = userEvent.setup();
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    await user.click(screen.getByText('light'));
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');

    await user.click(screen.getByText('system'));
    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('throws a clear error when useTheme is used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Consumer />)).toThrow('useTheme must be used within ThemeProvider');

    consoleError.mockRestore();
  });
});
