/**
 * Landing CTA Section
 * Final call-to-action section
 */

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCTA(): JSX.Element {
  return (
    <section className="w-full bg-background py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-16 text-center border border-line">
          <h2 className="font-headings font-bold text-foreground tracking-tight text-5xl mb-4">
            Ready to support creators?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-[620px] mx-auto mb-8">
            Join thousands of supporters sending tips on Dorisio. Fast, secure, and with zero platform fees.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/creators">
              <button className="bg-primary text-primary-foreground text-sm font-semibold px-8 py-4 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-2">
                Start Supporting
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="#features">
              <button className="border border-line text-sm font-semibold text-foreground px-8 py-4 rounded-full hover:bg-muted transition-colors">
                Learn More
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
