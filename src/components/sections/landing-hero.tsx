/**
 * Landing Hero Section
 * Main hero section with headline, description, and CTAs
 */

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingHero(): JSX.Element {
  return (
    <div className="w-full bg-background">
      <div className="max-w-[1200px] mx-auto px-8 pt-20 pb-16 grid grid-cols-2 gap-16 items-center">
        {/* Left Column - Text Content */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-soft border border-line rounded-full pl-1.5 pr-4 py-1.5">
            <span className="bg-gold text-gold-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              New
            </span>
            <span className="text-sm font-medium text-foreground">
              Now live on Stellar · USDC settlement
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-foreground" />
          </div>

          {/* Headline */}
          <h1
            className="font-headings font-bold text-foreground tracking-tight mt-7"
            style={{ fontSize: '56px', lineHeight: '1.02' }}
          >
            Tip any creator.
            <br />
            <span className="text-muted-foreground">Anywhere.</span>
            <br />
            In seconds.
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mt-6 leading-relaxed max-w-[480px]">
            Dorisio is tipping infrastructure for the creator economy. Fans send instant USDC —
            creators claim it in one tap. No borders, no 30% cuts.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 mt-8">
            <Link href="/creators">
              <button className="bg-primary text-primary-foreground text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-primary/90 transition-colors">
                Find a creator
              </button>
            </Link>
            <Link href="#features">
              <button className="border border-line text-sm font-semibold text-foreground px-7 py-3.5 rounded-full flex items-center gap-2 hover:bg-muted transition-colors">
                Learn more
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-14 mt-14 pt-8 border-t border-line">
            <div className="space-y-1">
              <p className="text-4xl font-bold text-foreground">50K+</p>
              <p className="text-xs text-muted-foreground font-medium">Creators</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-foreground">$10M+</p>
              <p className="text-xs text-muted-foreground font-medium">Tips Sent</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-foreground">100K+</p>
              <p className="text-xs text-muted-foreground font-medium">Users</p>
            </div>
          </div>
        </div>

        {/* Right Column - Illustration/Showcase */}
        <div className="relative h-[480px] bg-gradient-to-br from-primary/10 to-secondary/20 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <svg
              className="w-full h-full"
              viewBox="0 0 400 480"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="200" cy="240" r="150" stroke="currentColor" strokeWidth="2" />
              <circle cx="200" cy="240" r="100" stroke="currentColor" strokeWidth="2" />
              <circle cx="200" cy="240" r="50" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/20 mb-4">
              <span className="text-5xl">💳</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Tip Creators</h3>
            <p className="text-muted-foreground text-sm">Direct USDC transfer in seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
