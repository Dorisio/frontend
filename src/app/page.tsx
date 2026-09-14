/**
 * Home Page
 * Landing page for Dorisio - matches Untitled-1.css design
 */

import { LandingNavbar } from '@/components/sections/landing-navbar';
import { LandingHero } from '@/components/sections/landing-hero';
import { LandingFeatures } from '@/components/sections/landing-features';
import { LandingCTA } from '@/components/sections/landing-cta';
import { Footer } from '@/components/layout/footer';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <LandingNavbar />

      {/* Hero Section */}
      <LandingHero />

      {/* Features Section */}
      <LandingFeatures />

      {/* CTA Section */}
      <LandingCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}
