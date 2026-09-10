'use client';

import Link from 'next/link';
import { useState } from 'react';

export function CTASection(): JSX.Element {
  const [hoverPrimary, setHoverPrimary] = useState(false);
  const [hoverSecondary, setHoverSecondary] = useState(false);

  return (
    <section className="py-section" style={{ backgroundColor: 'var(--primary)' }}>
      <div className="section-container text-center space-y-8">
        <h2 className="text-display-md" style={{ color: 'var(--on-primary)' }}>
          Ready to support your favorite creators?
        </h2>
        <p className="text-title-md max-w-2xl mx-auto" style={{ color: 'var(--on-primary)' }}>
          Join thousands of supporters sending tips instantly with USDC.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/auth/signup">
            <button
              className="px-8 py-3 h-12 rounded-md font-semibold transition-all duration-200"
              style={{
                backgroundColor: 'var(--on-primary)',
                color: 'var(--primary)',
                opacity: hoverPrimary ? 0.9 : 1,
              }}
              onMouseEnter={() => setHoverPrimary(true)}
              onMouseLeave={() => setHoverPrimary(false)}
            >
              Get Started Free
            </button>
          </Link>
          <Link href="#features">
            <button
              className="px-8 py-3 h-12 rounded-md font-semibold border-2 transition-colors duration-200"
              style={{
                borderColor: 'var(--on-primary)',
                color: 'var(--on-primary)',
                backgroundColor: hoverSecondary ? 'var(--on-primary)' : 'transparent',
              }}
              onMouseEnter={() => setHoverSecondary(true)}
              onMouseLeave={() => setHoverSecondary(false)}
            >
              Learn More
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
