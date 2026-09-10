/**
 * Hero Section
 * ClickHouse Design System - Black canvas with electric yellow accents
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Coins, Sparkles } from 'lucide-react';

export function HeroSection(): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-canvas py-24 md:py-40">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="section-container relative z-10 space-y-12">
        {/* Main Content */}
        <div className="max-w-5xl space-y-8">
          <div className="space-y-6 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 badge badge-primary">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Stellar Blockchain</span>
            </div>

            {/* Headline */}
            <h1 className="text-display-xl tracking-tight text-ink">
              Support Creators
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Instantly & Securely
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-title-md text-body max-w-2xl leading-relaxed">
              Send tips to your favorite creators using USDC on Stellar. Experience lightning-fast
              transactions with zero intermediaries.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Link href="/auth/signup" className="group">
              <button className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                Start Supporting Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="#features">
              <button className="btn-secondary w-full sm:w-auto">Explore Features</button>
            </Link>
          </div>

          {/* Stats */}
          <div className="pt-12 grid grid-cols-3 gap-8 divider">
            <div className="space-y-2">
              <p className="text-stat">50K+</p>
              <p className="text-body-sm text-muted">Active Creators</p>
            </div>
            <div className="space-y-2">
              <p className="text-stat">$10M+</p>
              <p className="text-body-sm text-muted">Tips Sent</p>
            </div>
            <div className="space-y-2">
              <p className="text-stat">100K+</p>
              <p className="text-body-sm text-muted">Happy Supporters</p>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="pt-8 grid md:grid-cols-3 gap-6">
          <div className="card-dark hover:border-primary/50 transition-colors group">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-surface-elevated rounded-lg group-hover:bg-primary/10 transition-colors">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-ink mb-1">Lightning Fast</h3>
                <p className="text-body-sm text-muted">Settle in seconds</p>
              </div>
            </div>
          </div>

          <div className="card-dark hover:border-primary/50 transition-colors group">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-surface-elevated rounded-lg group-hover:bg-primary/10 transition-colors">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-ink mb-1">Verified Creators</h3>
                <p className="text-body-sm text-muted">100% authentic</p>
              </div>
            </div>
          </div>

          <div className="card-dark hover:border-primary/50 transition-colors group">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-surface-elevated rounded-lg group-hover:bg-primary/10 transition-colors">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-ink mb-1">USDC Stablecoin</h3>
                <p className="text-body-sm text-muted">No volatility</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
