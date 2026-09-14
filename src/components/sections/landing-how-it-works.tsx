'use client';

import { Search, Zap, Wallet } from 'lucide-react';

export function LandingHowItWorks(): JSX.Element {
  return (
    <div className="w-full" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0ca16b' }}>
              How it works
            </p>
            <h2
              className="font-headings text-4xl font-bold tracking-tight mt-3"
              style={{ color: '#0b1220' }}
            >
              Tipping, minus the friction
            </h2>
          </div>
          <p className="text-base max-w-[380px]" style={{ color: '#64748b' }}>
            No accounts, no forms, no region blocks. Three steps and the money is moving.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 mt-12">
          <div
            className="border rounded-xl p-8 relative overflow-hidden"
            style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}
          >
            <span
              className="font-headings text-[64px] font-bold absolute top-2 right-6 leading-none"
              style={{ color: '#e6ebf2' }}
            >
              01
            </span>
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center relative"
              style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2', color: '#0b1220' }}
            >
              <Search className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-xl font-semibold mt-6 relative" style={{ color: '#0b1220' }}>
              Find your creator
            </h3>
            <p className="text-base mt-2.5 leading-relaxed relative" style={{ color: '#64748b' }}>
              Search any handle across X, TikTok, YouTube and more. Every creator already has a
              claimable page.
            </p>
          </div>
          <div
            className="border rounded-xl p-8 relative overflow-hidden"
            style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}
          >
            <span
              className="font-headings text-[64px] font-bold absolute top-2 right-6 leading-none"
              style={{ color: '#e6ebf2' }}
            >
              02
            </span>
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center relative"
              style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2', color: '#0b1220' }}
            >
              <Zap className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-xl font-semibold mt-6 relative" style={{ color: '#0b1220' }}>
              Tip in one tap
            </h3>
            <p className="text-base mt-2.5 leading-relaxed relative" style={{ color: '#64748b' }}>
              Pick $1, $5 or any amount. Pay with USDC on Stellar — settled in ~5 seconds.
            </p>
          </div>
          <div
            className="border rounded-xl p-8 relative overflow-hidden"
            style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}
          >
            <span
              className="font-headings text-[64px] font-bold absolute top-2 right-6 leading-none"
              style={{ color: '#e6ebf2' }}
            >
              03
            </span>
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center relative"
              style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2', color: '#0b1220' }}
            >
              <Wallet className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-xl font-semibold mt-6 relative" style={{ color: '#0b1220' }}>
              Creator claims it
            </h3>
            <p className="text-base mt-2.5 leading-relaxed relative" style={{ color: '#64748b' }}>
              Creators verify their handle and connect a wallet. Earnings land instantly, no
              payout delays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
