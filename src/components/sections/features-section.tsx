/**
 * Features Section
 * Showcase of Dorisio features
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
    <section id="features" className="py-20 md:py-32 bg-background">
      <div className="container-tight space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose Dorisio?</h2>
          <p className="text-lg text-muted-foreground">
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
                className="space-y-4 p-6 rounded-lg border border-border hover:border-primary hover:shadow-lg transition-smooth group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="mt-20 pt-20 border-t border-border space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold">How It Works</h3>
            <p className="text-muted-foreground">Get started in just a few simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your Dorisio account' },
              { step: '2', title: 'Connect Wallet', description: 'Link your Stellar wallet' },
              { step: '3', title: 'Find Creators', description: 'Browse verified creators' },
              { step: '4', title: 'Send Tips', description: 'Support with instant USDC' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-5 -right-3 text-2xl text-muted-foreground">
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
