/**
 * Landing Features Section
 * Key features and benefits section
 */

'use client';

import { Zap, Shield, Coins, Globe, Lock, TrendingUp } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: 'Instant Settlement',
    description: 'USDC transfers settle in seconds, not days',
  },
  {
    icon: <Globe className="w-6 h-6 text-primary" />,
    title: 'Borderless',
    description: 'Support creators anywhere in the world',
  },
  {
    icon: <Coins className="w-6 h-6 text-primary" />,
    title: 'No Platform Fees',
    description: '100% of tips go directly to creators',
  },
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: 'Verified Creators',
    description: 'All creators go through identity verification',
  },
  {
    icon: <Lock className="w-6 h-6 text-primary" />,
    title: 'Secure & Private',
    description: 'Bank-grade security for all transactions',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-primary" />,
    title: 'Creator Analytics',
    description: 'Track earnings and tips in real-time',
  },
];

export function LandingFeatures(): JSX.Element {
  return (
    <section id="features" className="w-full bg-soft py-24 border-y border-line">
      <div className="max-w-[1200px] mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-[620px] mx-auto">
          <h2 className="font-headings font-bold text-foreground tracking-tight text-5xl mb-4">
            Why Creators Love Dorisio
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Built for the creator economy with features that actually matter
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-background border border-line rounded-lg p-6 hover:border-primary/50 transition-colors group"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-secondary rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
