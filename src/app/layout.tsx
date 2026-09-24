import type { Metadata } from 'next';
import { Providers } from './providers';
import { THEME_STORAGE_KEY } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dorisio - Creator Tipping Platform',
  description: 'Support creators across platforms with instant USDC payments powered by Stellar',
};

// Applied before hydration so the correct theme class is present on first
// paint (no flash of the wrong theme). Must stay in sync with the
// resolution logic in theme-provider.tsx.
const noFlashScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored || 'system';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
