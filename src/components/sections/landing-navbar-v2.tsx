'use client';

import { Logo } from '@/components/logo';

export function LandingNavbarV2(): JSX.Element {
  return (
    <div className="w-full border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Logo width={32} height={32} />
            <span className="font-headings text-xl font-bold " style={{ color: '#0b1220' }}>
              Dorisio
            </span>
          </a>
          <div className="flex items-center gap-7 text-sm font-medium" style={{ color: '#64748b' }}>
            <a
              href="#creators"
              style={{ color: '#0b1220' }}
              className="hover:opacity-70 transition-opacity"
            >
              Creators
            </a>
            <a
              href="#how-it-works"
              style={{ color: '#0b1220' }}
              className="hover:opacity-70 transition-opacity"
            >
              How it works
            </a>
            <a
              href="#fees"
              style={{ color: '#0b1220' }}
              className="hover:opacity-70 transition-opacity"
            >
              Fees
            </a>
            <a
              href="#developers"
              style={{ color: '#0b1220' }}
              className="hover:opacity-70 transition-opacity"
            >
              Developers
            </a>
            <a
              href="#manifesto"
              style={{ color: '#0b1220' }}
              className="hover:opacity-70 transition-opacity"
            >
              Manifesto
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/auth/signin">
            <button
              className="text-sm font-medium px-4 py-2.5 hover:bg-muted rounded transition-colors"
              type="button"
              style={{ color: '#0b1220' }}
            >
              Log in
            </button>
          </a>
          <a href="/auth/signup">
            <button
              className="text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
              type="button"
              style={{ backgroundColor: '#0b1220', color: '#ffffff' }}
            >
              Claim your page
            </button>
          </a>
          <a href="/creators">
            <button
              className="text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
              type="button"
              style={{ backgroundColor: '#0ca16b', color: '#ffffff' }}
            >
              Send a tip
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
