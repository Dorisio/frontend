'use client';

import { LandingNavbarV2 } from '@/components/sections/landing-navbar-v2';
import { LandingHeroV2 } from '@/components/sections/landing-hero-v2';
import { LandingLogoStrip } from '@/components/sections/landing-logo-strip';
import { LandingHowItWorks } from '@/components/sections/landing-how-it-works';
import { LandingFeaturesGrid } from '@/components/sections/landing-features-grid';
import { EarningsPanel } from '@/components/sections/earnings-panel';
import { FeeCompare } from '@/components/sections/fee-compare';
import { SdkSection } from '@/components/sections/sdk-section';
import { SocialProof } from '@/components/sections/social-proof';
import { FooterCta } from '@/components/sections/footer-cta';
import { LandingFooter } from '@/components/sections/landing-footer';

export default function LandingPage(): JSX.Element {
  return (
    <>
      <style>{`body { background-color: #ffffff !important; }
        ::selection { background-color: #0ca16b; color: #ffffff; }
        ::-moz-selection { background-color: #0ca16b; color: #ffffff; }
      `}</style>
      <main className="w-full" style={{ backgroundColor: '#ffffff' }}>
        <LandingNavbarV2 />
        <LandingHeroV2 />
        <LandingLogoStrip />
        <LandingHowItWorks />
        <LandingFeaturesGrid />
        <EarningsPanel />
        <FeeCompare />
        <SdkSection />
        <SocialProof />
        <FooterCta />
        <LandingFooter />
      </main>
    </>
  );
}
