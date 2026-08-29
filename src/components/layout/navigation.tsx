/**
 * Navigation Bar
 * Header navigation component
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export function Navigation(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const toggleMenu = (): void => setIsOpen(!isOpen);

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-40">
      <div className="container-tight flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <span>💰</span>
          Dorisio
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <a href="#features" className="text-sm hover:text-primary transition-smooth">
            Features
          </a>
          <a href="#creators" className="text-sm hover:text-primary transition-smooth">
            For Creators
          </a>
          <a href="#faq" className="text-sm hover:text-primary transition-smooth">
            FAQ
          </a>
          <a href="#learn" className="text-sm hover:text-primary transition-smooth">
            Docs
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex gap-3 items-center">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href={user?.role === 'creator' ? '/creator' : '/supporter'}>
                <Button size="sm">{user?.role === 'creator' ? 'Creator Hub' : 'Send Tip'}</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 hover:bg-accent rounded-lg transition-smooth"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-down">
          <div className="container-tight py-4 space-y-3">
            <a
              href="#features"
              className="block text-sm hover:text-primary transition-smooth py-2"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a
              href="#creators"
              className="block text-sm hover:text-primary transition-smooth py-2"
              onClick={() => setIsOpen(false)}
            >
              For Creators
            </a>
            <a
              href="#faq"
              className="block text-sm hover:text-primary transition-smooth py-2"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </a>
            <a
              href="#learn"
              className="block text-sm hover:text-primary transition-smooth py-2"
              onClick={() => setIsOpen(false)}
            >
              Docs
            </a>

            <div className="pt-4 space-y-2 border-t border-border">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                  <Link
                    href={user?.role === 'creator' ? '/creator' : '/supporter'}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button size="sm" className="w-full justify-start">
                      {user?.role === 'creator' ? 'Creator Hub' : 'Send Tip'}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full justify-start">
                      Get Started
                    </Button>
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
