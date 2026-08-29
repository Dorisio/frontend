/**
 * Home Page
 * Landing page for Dorisio
 */

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/sections/hero-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { CreatorSpotlightSection } from '@/components/sections/creator-spotlight';
import { FAQSection } from '@/components/sections/faq-section';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col">
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Creator Spotlight */}
      <CreatorSpotlightSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-16">
        <div className="container-tight text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
            Ready to support your favorite creators?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of supporters sending tips instantly with USDC.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                Get Started Free
              </Button>
            </Link>
            <Link href="#learn-more">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
