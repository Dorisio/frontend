/**
 * Landing Page Navbar
 * Top navigation for landing page with Dorisio branding
 */

'use client';

import Link from 'next/link';

export function LandingNavbar(): JSX.Element {
  return (
    <div className="w-full bg-background border-b border-line">
      <div className="max-w-[1200px] mx-auto px-8 py-5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-headings text-[18px] font-bold text-primary-foreground">
                D
              </span>
            </div>
            <span className="font-headings text-xl font-bold text-foreground tracking-tight">
              Dorisio
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <Link href="#creators" className="hover:text-foreground transition-colors">
              Creators
            </Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="#fees" className="hover:text-foreground transition-colors">
              Fees
            </Link>
            <Link href="#developers" className="hover:text-foreground transition-colors">
              Developers
            </Link>
            <Link href="#manifesto" className="hover:text-foreground transition-colors">
              Manifesto
            </Link>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/auth/signin">
            <button className="text-sm font-medium text-foreground px-4 py-2.5 hover:bg-muted rounded-lg transition-colors">
              Log in
            </button>
          </Link>
          <Link href="/auth/signup">
            <button className="text-sm font-medium bg-ink text-ink-foreground px-5 py-2.5 rounded-full hover:bg-ink/90 transition-colors">
              Claim your page
            </button>
          </Link>
          <Link href="#send-tip">
            <button className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
              Send a tip
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
