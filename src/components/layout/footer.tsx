/**
 * Footer
 * Application footer with ClickHouse design system
 */

import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';

export function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto m-4 rounded-lg" style={{ backgroundColor: 'var(--surface-soft)' }}>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Footer Content */}
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div
              className="flex items-center gap-2 font-bold text-lg"
              style={{ color: 'var(--primary)' }}
            >
              Dorisio
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Support creators instantly with USDC on Stellar.
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href="https://twitter.com/dorisio"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/dorisio"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@dorisio.io"
                className="transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>
              Product
            </h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/features"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Pricing
              </Link>
              <Link
                href="/security"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Security
              </Link>
              <Link
                href="/roadmap"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Roadmap
              </Link>
            </div>
          </div>

          {/* For Creators */}
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>
              For Creators
            </h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/creators"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Get Started
              </Link>
              <Link
                href="/creator-guide"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Creator Guide
              </Link>
              <Link
                href="/integrations"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Integrations
              </Link>
              <Link
                href="/community"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Community
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>
              Legal
            </h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/privacy"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Contact
              </Link>
              <Link
                href="/status"
                className="block transition-smooth hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Status
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="pt-8" style={{ borderTopColor: 'var(--hairline)', borderTopWidth: '1px' }}>
          {/* Bottom Section */}
          <div
            className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            <p>&copy; {currentYear} Dorisio. All rights reserved.</p>
            <div className="flex gap-4">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-smooth"
              >
                Powered by Stellar
              </a>
              <span>•</span>
              <a
                href="https://www.center.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-smooth"
              >
                USDC on Stellar
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
