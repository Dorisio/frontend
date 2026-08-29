/**
 * Footer
 * Application footer
 */

import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';

export function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/50 mt-auto">
      <div className="container-tight py-12">
        {/* Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
              <span>💰</span>
              Dorisio
            </div>
            <p className="text-sm text-muted-foreground">
              Support creators instantly with USDC on Stellar.
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href="https://twitter.com/dorisio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/dorisio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@dorisio.io"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="font-semibold">Product</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/features"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Pricing
              </Link>
              <Link
                href="/security"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Security
              </Link>
              <Link
                href="/roadmap"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Roadmap
              </Link>
            </div>
          </div>

          {/* For Creators */}
          <div className="space-y-3">
            <h3 className="font-semibold">For Creators</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/creators"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Get Started
              </Link>
              <Link
                href="/creator-guide"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Creator Guide
              </Link>
              <Link
                href="/integrations"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Integrations
              </Link>
              <Link
                href="/community"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Community
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold">Legal</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/privacy"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Contact
              </Link>
              <Link
                href="/status"
                className="block text-muted-foreground hover:text-primary transition-smooth"
              >
                Status
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {currentYear} Dorisio. All rights reserved.</p>
            <div className="flex gap-4">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-smooth"
              >
                Powered by Stellar
              </a>
              <span>•</span>
              <a
                href="https://www.center.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-smooth"
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
