/**
 * Theme Provider
 * Handles dark/light mode theming
 */

'use client';

import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: 'light' | 'dark' | 'system';
  enableSystem?: boolean;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'Dorisio-theme',
}: ThemeProviderProps): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<string | undefined>();

  useEffect(() => {
    setMounted(true);

    // Get stored theme or use default
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    let resolvedTheme = storedTheme || defaultTheme;

    // If system theme is enabled and no stored theme, use system preference
    if (enableSystem && resolvedTheme === 'system') {
      const prefersDark =
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = prefersDark ? 'dark' : 'light';
    }

    setTheme(resolvedTheme as string);
    applyTheme(resolvedTheme as string, attribute);
  }, [attribute, defaultTheme, enableSystem, storageKey]);

  const switchTheme = (newTheme: 'light' | 'dark' | 'system'): void => {
    let themeToApply = newTheme;

    if (enableSystem && newTheme === 'system') {
      const prefersDark =
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }

    setTheme(newTheme);
    applyTheme(themeToApply as string, attribute);
    localStorage.setItem(storageKey, newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme: theme as string, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Apply theme to document
 */
function applyTheme(theme: string, attribute: string): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  if (attribute === 'class') {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  } else {
    root.setAttribute('data-theme', theme);
  }
}

/**
 * Theme Context
 */
interface ThemeContextType {
  theme: string;
  switchTheme: (theme: 'light' | 'dark' | 'system') => void;
}

import { createContext, useContext } from 'react';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * useTheme hook
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
