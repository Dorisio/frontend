'use client';

import Link from 'next/link';
import { ArrowRight, Check, Wallet } from 'lucide-react';

export function LandingHeroV2(): JSX.Element {
  return (
    <div className="w-full">
      <div
        style={{ backgroundColor: '#ffffff' }}
        className="max-w-[1200px] mx-auto px-8 pt-20 pb-16 grid grid-cols-2 gap-16 items-center"
      >
        <div>
          <div
            className="inline-flex items-center gap-2 border rounded-full pl-1.5 pr-4 py-1.5"
            style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}
          >
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#ffbf1f', color: '#0b1220' }}
            >
              New
            </span>
            <span className="text-sm font-medium" style={{ color: '#0b1220' }}>
              Now live on Stellar · USDC settlement
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: '#0b1220' }} />
          </div>

          <h1
            className="font-headings font-bold tracking-tight mt-7"
            style={{ fontSize: '56px', lineHeight: '1.02', color: '#0b1220' }}
          >
            Tip any creator.
            <br />
            <span style={{ color: '#64748b' }}>Anywhere.</span>
            <br />
            In seconds.
          </h1>

          <p className="text-base mt-6 leading-relaxed max-w-[480px]" style={{ color: '#64748b' }}>
            Dorisio is tipping infrastructure for the creator economy. Fans send instant USDC —
            creators claim it in one tap. No borders, no 30% cuts.
          </p>

          <div className="flex items-center gap-3 mt-8">
            <Link href="/creators">
              <button
                className="text-sm font-semibold px-7 py-3.5 rounded-full hover:opacity-90 transition-opacity"
                type="button"
                style={{ backgroundColor: '#0ca16b', color: '#ffffff' }}
              >
                Find a creator
              </button>
            </Link>
            <Link href="#how-it-works">
              <button
                className="border text-sm font-semibold px-7 py-3.5 rounded-full flex items-center gap-2 hover:bg-muted transition-colors"
                type="button"
                style={{ borderColor: '#e6ebf2', color: '#0b1220' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15px"
                  height="15px"
                  viewBox="0 0 24 24"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3.2"
                    d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
                  ></path>
                </svg>
                Watch how it works
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-6 mt-9">
            <div className="flex -space-x-2.5">
              <img
                src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/East Asian/0"
                className="w-9 h-9 rounded-full border-2"
                alt="avatar"
                style={{ borderColor: '#ffffff' }}
              />
              <img
                src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/Middle Eastern/4"
                className="w-9 h-9 rounded-full border-2"
                alt="avatar"
                style={{ borderColor: '#ffffff' }}
              />
              <img
                src="https://storage.googleapis.com/banani-avatars/avatar/female/18-25/African/7"
                className="w-9 h-9 rounded-full border-2"
                alt="avatar"
                style={{ borderColor: '#ffffff' }}
              />
              <img
                src="https://storage.googleapis.com/banani-avatars/avatar/male/35-50/Hispanic/2"
                className="w-9 h-9 rounded-full border-2"
                alt="avatar"
                style={{ borderColor: '#ffffff' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    width="14px"
                    height="14px"
                    viewBox="0 0 24 24"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.4285714285714284"
                      d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"
                    ></path>
                  </svg>
                ))}
                <span className="text-sm font-semibold ml-1" style={{ color: '#0b1220' }}>
                  4.9
                </span>
              </div>
              <p className="text-sm" style={{ color: '#64748b' }}>
                from 48,000+ supporters
              </p>
            </div>
            <div className="w-px h-10" style={{ backgroundColor: '#e6ebf2' }}></div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0b1220' }}>
                $2.4M tipped
              </p>
              <p className="text-sm" style={{ color: '#64748b' }}>
                across 140 countries
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div
            className="absolute w-[480px] h-[480px] rounded-full"
            style={{ backgroundColor: '#e7f6ee', filter: 'blur(10px)', opacity: 0.7 }}
          ></div>

          <div
            className="absolute top-6 -left-2 border rounded-xl px-4 py-3 flex items-center gap-2.5 z-10"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e6ebf2',
              boxShadow: '0 12px 32px rgba(11, 18, 32, 0.1)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
            >
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0b1220' }}>
                $10 USDC received
              </p>
              <p className="text-xs" style={{ color: '#64748b' }}>
                Texas · 4s ago
              </p>
            </div>
          </div>

          <div
            className="absolute bottom-16 -right-2 rounded-xl px-4 py-3 z-10 flex items-center gap-2.5"
            style={{ backgroundColor: '#0b1220', color: '#ffffff' }}
          >
            <Wallet className="w-4.5 h-4.5" />
            <div>
              <p className="text-sm font-semibold">$1,284.50</p>
              <p className="text-xs" style={{ opacity: 0.7 }}>
                Claimed to wallet
              </p>
            </div>
          </div>

          <div className="relative z-[1]">
            <div
              className="rounded-2xl border p-6 w-[380px]"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e6ebf2',
                boxShadow: '0 24px 64px rgba(11, 18, 32, 0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="https://storage.googleapis.com/banani-avatars/avatar/female/25-35/Hispanic/2"
                    className="w-12 h-12 rounded-full"
                    alt="creator"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-base font-semibold" style={{ color: '#0b1220' }}>
                        Maya Chen
                      </p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16px"
                        height="16px"
                        viewBox="0 0 24 24"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                        >
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77a4 4 0 0 1 6.74 0a4 4 0 0 1 4.78 4.78a4 4 0 0 1 0 6.74a4 4 0 0 1-4.77 4.78a4 4 0 0 1-6.75 0a4 4 0 0 1-4.78-4.77a4 4 0 0 1 0-6.76"></path>
                          <path d="m9 12l2 2l4-4"></path>
                        </g>
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: '#64748b' }}>
                      @mayadraws · 892k fans
                    </p>
                  </div>
                </div>
                <div
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: '#e7f6ee', color: '#0a6b48' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#0ca16b' }}
                  ></span>
                  Verified
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5">
                <div
                  className="border rounded-md py-1.5 text-center text-xs font-medium"
                  style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2', color: '#0b1220' }}
                >
                  YouTube
                </div>
                <div
                  className="border rounded-md py-1.5 text-center text-xs font-medium"
                  style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2', color: '#0b1220' }}
                >
                  TikTok
                </div>
                <div
                  className="border rounded-md py-1.5 text-center text-xs font-medium"
                  style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2', color: '#0b1220' }}
                >
                  Instagram
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium" style={{ color: '#0b1220' }}>
                  Send some love
                </p>
                <div className="flex gap-2 mt-2.5">
                  <div
                    className="flex-1 text-center text-sm font-medium border rounded-full py-2.5"
                    style={{
                      backgroundColor: '#f7f9fc',
                      borderColor: '#e6ebf2',
                      color: '#0b1220',
                    }}
                  >
                    $1
                  </div>
                  <div
                    className="flex-1 text-center text-sm font-semibold rounded-full py-2.5"
                    style={{ backgroundColor: '#0b1220', color: '#ffffff' }}
                  >
                    $5
                  </div>
                  <div
                    className="flex-1 text-center text-sm font-medium border rounded-full py-2.5"
                    style={{
                      backgroundColor: '#f7f9fc',
                      borderColor: '#e6ebf2',
                      color: '#0b1220',
                    }}
                  >
                    $10
                  </div>
                  <div
                    className="flex-1 text-center text-sm font-medium border rounded-full py-2.5"
                    style={{
                      backgroundColor: '#f7f9fc',
                      borderColor: '#e6ebf2',
                      color: '#0b1220',
                    }}
                  >
                    $25
                  </div>
                </div>
                <div
                  className="mt-2.5 border rounded-full px-4 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}
                >
                  <span className="text-sm" style={{ color: '#64748b' }}>
                    Add a message…
                  </span>
                </div>
              </div>

              <button
                className="w-full mt-4 text-sm font-semibold rounded-full py-3.5 flex items-center justify-center gap-2"
                type="button"
                style={{ backgroundColor: '#0ca16b', color: '#ffffff' }}
              >
                Tip $5 in USDC
              </button>

              <div
                className="flex items-center justify-center gap-4 mt-3 text-xs"
                style={{ color: '#64748b' }}
              >
                <span className="flex items-center gap-1">Settles in ~5s</span>
                <span className="flex items-center gap-1">Fee $0.0005</span>
              </div>

              <div
                className="mt-4 pt-4 border-t flex items-center gap-2.5"
                style={{ borderColor: '#e6ebf2' }}
              >
                <div className="flex -space-x-2">
                  <img
                    src="https://storage.googleapis.com/banani-avatars/avatar/male/18-25/African/1"
                    className="w-7 h-7 rounded-full border-2"
                    alt="supporter"
                    style={{ borderColor: '#ffffff' }}
                  />
                  <img
                    src="https://storage.googleapis.com/banani-avatars/avatar/female/18-25/European/5"
                    className="w-7 h-7 rounded-full border-2"
                    alt="supporter"
                    style={{ borderColor: '#ffffff' }}
                  />
                  <img
                    src="https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/3"
                    className="w-7 h-7 rounded-full border-2"
                    alt="supporter"
                    style={{ borderColor: '#ffffff' }}
                  />
                </div>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  Jonas + 2,418 tipped this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
