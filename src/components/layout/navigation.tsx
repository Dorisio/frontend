'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function Navigation(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const toggleMenu = (): void => setIsOpen(!isOpen);

  return (
    <nav
      className="sticky top-0 z-40 border-b m-4 rounded-lg"
      style={{
        backgroundColor: 'var(--canvas)',
        borderBottomColor: 'var(--hairline)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 flex h-16 items-center justify-between">
        {/* Logo - Text only */}
        <Link href="/" className="font-bold text-xl" style={{ color: 'var(--primary)' }}>
          Dorisio
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <a
            href="#features"
            className="text-sm transition-smooth"
            style={{ color: 'var(--body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
          >
            Features
          </a>
          <a
            href="#creators"
            className="text-sm transition-smooth"
            style={{ color: 'var(--body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
          >
            For Creators
          </a>
          <a
            href="#faq"
            className="text-sm transition-smooth"
            style={{ color: 'var(--body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
          >
            FAQ
          </a>
          <a
            href="#learn"
            className="text-sm transition-smooth"
            style={{ color: 'var(--body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
          >
            Docs
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex gap-3 items-center">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <button className="btn-secondary text-sm">Dashboard</button>
              </Link>
              <Link href={user?.role === 'creator' ? '/creator' : '/supporter'}>
                <button className="btn-primary text-sm">
                  {user?.role === 'creator' ? 'Creator Hub' : 'Send Tip'}
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <button className="btn-secondary text-sm">Sign In</button>
              </Link>
              <Link href="/auth/signup">
                <button className="btn-primary text-sm">Get Started</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg transition-smooth"
          style={{ color: 'var(--body)' }}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden border-t animate-slide-down"
          style={{
            backgroundColor: 'var(--canvas)',
            borderTopColor: 'var(--hairline)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
            <a
              href="#features"
              className="block text-sm transition-smooth py-2"
              style={{ color: 'var(--body)' }}
              onClick={() => setIsOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
            >
              Features
            </a>
            <a
              href="#creators"
              className="block text-sm transition-smooth py-2"
              style={{ color: 'var(--body)' }}
              onClick={() => setIsOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
            >
              For Creators
            </a>
            <a
              href="#faq"
              className="block text-sm transition-smooth py-2"
              style={{ color: 'var(--body)' }}
              onClick={() => setIsOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
            >
              FAQ
            </a>
            <a
              href="#learn"
              className="block text-sm transition-smooth py-2"
              style={{ color: 'var(--body)' }}
              onClick={() => setIsOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
            >
              Docs
            </a>

            <div className="pt-4 space-y-2 border-t" style={{ borderTopColor: 'var(--hairline)' }}>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <button className="btn-secondary w-full text-sm">Dashboard</button>
                  </Link>
                  <Link
                    href={user?.role === 'creator' ? '/creator' : '/supporter'}
                    onClick={() => setIsOpen(false)}
                  >
                    <button className="btn-primary w-full text-sm">
                      {user?.role === 'creator' ? 'Creator Hub' : 'Send Tip'}
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                    <button className="btn-secondary w-full text-sm">Sign In</button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                    <button className="btn-primary w-full text-sm">Get Started</button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
