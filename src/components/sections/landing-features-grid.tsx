'use client';

import { Zap, Layers, Globe, Lock, TrendingUp } from 'lucide-react';

export function LandingFeaturesGrid(): JSX.Element {
  return (
    <div className="w-full border-y" style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-24">
        <div className="text-center max-w-[620px] mx-auto">
          <p className="text-sm font-semibold" style={{ color: '#0ca16b' }}>
            Why Dorisio
          </p>
          <h2
            className="font-headings text-4xl font-bold tracking-tight mt-3"
            style={{ color: '#0b1220' }}
          >
            Infrastructure, not another platform
          </h2>
          <p className="text-base mt-4" style={{ color: '#64748b' }}>
            We don't want your audience. We just move the money — fast, cheap, and everywhere.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 mt-12">
          <div
            className="border rounded-xl p-7"
            style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
              >
                <Zap className="w-4.75 h-4.75" />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#e7f6ee', color: '#0a6b48' }}
              >
                Instant tips
              </span>
            </div>
            <h3 className="text-lg font-semibold mt-5" style={{ color: '#0b1220' }}>
              USDC in ~5 seconds
            </h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748b' }}>
              Stellar settles tips almost instantly for a fraction of a cent. No waiting days for
              payouts.
            </p>
          </div>
          <div
            className="border rounded-xl p-7"
            style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
              >
                <Layers className="w-4.75 h-4.75" />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#e7f6ee', color: '#0a6b48' }}
              >
                Multi-platform
              </span>
            </div>
            <h3 className="text-lg font-semibold mt-5" style={{ color: '#0b1220' }}>
              Every platform, one page
            </h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748b' }}>
              Your Dorisio link works on X, TikTok, YouTube, Twitch — and more platforms added
              weekly.
            </p>
          </div>
          <div
            className="border rounded-xl p-7"
            style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
              >
                <Globe className="w-4.75 h-4.75" />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#e7f6ee', color: '#0a6b48' }}
              >
                Borderless
              </span>
            </div>
            <h3 className="text-lg font-semibold mt-5" style={{ color: '#0b1220' }}>
              No country blocks
            </h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748b' }}>
              Fans from 140+ countries can tip creators anywhere. Money moves with no borders.
            </p>
          </div>
          <div
            className="border rounded-xl p-7"
            style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
              >
                <Lock className="w-4.75 h-4.75" />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#e7f6ee', color: '#0a6b48' }}
              >
                Secure
              </span>
            </div>
            <h3 className="text-lg font-semibold mt-5" style={{ color: '#0b1220' }}>
              Verified creators only
            </h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748b' }}>
              Every creator goes through identity verification. No imposters, no fraud.
            </p>
          </div>
          <div
            className="border rounded-xl p-7"
            style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
              >
                <TrendingUp className="w-4.75 h-4.75" />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#e7f6ee', color: '#0a6b48' }}
              >
                Analytics
              </span>
            </div>
            <h3 className="text-lg font-semibold mt-5" style={{ color: '#0b1220' }}>
              Earnings dashboard
            </h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748b' }}>
              See tips in real-time, track your best content, export earnings reports.
            </p>
          </div>
          <div
            className="border rounded-xl p-7"
            style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
              >
                <Zap className="w-4.75 h-4.75" />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#e7f6ee', color: '#0a6b48' }}
              >
                No fees
              </span>
            </div>
            <h3 className="text-lg font-semibold mt-5" style={{ color: '#0b1220' }}>
              100% reaches creators
            </h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748b' }}>
              Platform takes zero commission. Only the tiny Stellar network fee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
