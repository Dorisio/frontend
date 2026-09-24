/**
 * ThemeToggle
 * Cycles between light, dark, and system theme preferences.
 */

'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/components/theme-provider';

const THEME_ORDER: Theme[] = ['light', 'dark', 'system'];

const THEME_LABEL: Record<Theme, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
};

export function ThemeToggle(): JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleClick = (): void => {
    const currentIndex = THEME_ORDER.indexOf(theme);
    const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
    setTheme(nextTheme);
  };

  const Icon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="p-2 rounded-lg transition-smooth"
      style={{ color: 'var(--body)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
      aria-label={`Switch theme (current: ${THEME_LABEL[theme]})`}
      title={THEME_LABEL[theme]}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
