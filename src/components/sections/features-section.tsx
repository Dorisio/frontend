/**
 * Features Section
 * ClickHouse Design System styling
 */

import { CheckCircle, Zap, Globe, Lock, BarChart3, Headphones } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Send tips in seconds with Stellar blockchain technology',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Support creators from anywhere in the world instantly',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description: 'Enterprise-grade security with verified creator identity',
  },
  {
    icon: BarChart3,
    title: 'Transparent',
    description: 'View all transactions and your support history',
  },
  {
    icon: CheckCircle,
    title: 'Verified Creators',
    description: 'Only support authentic, verified creators you trust',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Get help whenever you need it from our support team',
  },
];

export function FeaturesSection(): JSX.Element {
  return (
    <section id="features" className="py-section bg-canvas">
      <div className="section-container space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto animate-slide-up">
          <h2 className="text-display-lg text-ink">Why Choose Dorisio?</h2>
          <p className="text-title-md text-body">
            Everything you need for a seamless creator support experience
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card-dark group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-ink text-title-md">{feature.title}</h3>
                  <p className="text-body leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="mt-24 pt-16 divider space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="text-display-md text-ink">How It Works</h3>
            <p className="text-body">Get started in just a few simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your Dorisio account' },
              { step: '2', title: 'Connect Wallet', description: 'Link your Stellar wallet' },
              { step: '3', title: 'Find Creators', description: 'Browse verified creators' },
              { step: '4', title: 'Send Tips', description: 'Support with instant USDC' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="space-y-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--on-primary)',
                    }}
                  >
                    {item.step}
                  </div>
                  <h4 className="font-bold text-ink">{item.title}</h4>
                  <p className="text-body-sm text-muted">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-5 -right-4 text-2xl text-muted">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
