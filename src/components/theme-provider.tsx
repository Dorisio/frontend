/**
 * Theme Provider
 * Handles dark/light mode theming
 */

'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'Dorisio-theme';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  if (theme === 'system') {
    return enableSystem ? getSystemTheme() : 'dark';
  }
  return theme;
}

function applyTheme(resolvedTheme: ResolvedTheme, attribute: 'class' | 'data-theme'): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  if (attribute === 'class') {
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  } else {
    root.setAttribute('data-theme', resolvedTheme);
  }
}

interface ThemeContextType {
  /** The user's selected preference: 'light' | 'dark' | 'system'. */
  theme: Theme;
  /** The actual theme applied to the document after resolving 'system'. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(defaultTheme, enableSystem)
  );

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = stored || defaultTheme;
    const initialResolved = resolveTheme(initialTheme, enableSystem);

    setThemeState(initialTheme);
    setResolvedTheme(initialResolved);
    applyTheme(initialResolved, attribute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enableSystem || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (): void => {
      const next = getSystemTheme();
      setResolvedTheme(next);
      applyTheme(next, attribute);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [attribute, enableSystem, theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      const nextResolved = resolveTheme(newTheme, enableSystem);

      setThemeState(newTheme);
      setResolvedTheme(nextResolved);
      applyTheme(nextResolved, attribute);
      localStorage.setItem(storageKey, newTheme);
    },
    [attribute, enableSystem, storageKey]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

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
