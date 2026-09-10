/**
 * Home Page
 * Landing page for Dorisio
 */

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/sections/hero-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { CreatorSpotlightSection } from '@/components/sections/creator-spotlight';
import { FAQSection } from '@/components/sections/faq-section';
import { CTASection } from '@/components/sections/cta-section';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col bg-canvas">
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
      <CTASection />

      <Footer />
    </main>
  );
}
