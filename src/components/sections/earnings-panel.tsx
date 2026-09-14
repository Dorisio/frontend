'use client';

export function EarningsPanel(): JSX.Element {
  const supporters = [
    {
      name: 'Jonas K.',
      handle: '@jonasbuilds',
      amount: '$25.00',
      time: '2m ago',
      avatar: 'https://storage.googleapis.com/banani-avatars/avatar/male/25-35/African/1',
    },
    {
      name: 'Sofia R.',
      handle: '@sofiareads',
      amount: '$10.00',
      time: '18m ago',
      avatar: 'https://storage.googleapis.com/banani-avatars/avatar/female/25-35/Hispanic/4',
    },
    {
      name: 'Dev Patel',
      handle: '@devpatel',
      amount: '$50.00',
      time: '1h ago',
      avatar: 'https://storage.googleapis.com/banani-avatars/avatar/male/25-35/South Asian/6',
    },
  ];

  const chartHeights = [34, 52, 44, 68, 58, 82, 74, 96, 64, 88, 70, 100];

  const dashboardFeatures = [
    {
      title: 'Supporter insights',
      desc: 'Top fans, repeat tippers, and messages — so you can thank the right people.',
    },
    {
      title: 'Clean history & receipts',
      desc: 'Every transaction logged with Stellar explorer links. Export CSV in one click.',
    },
    {
      title: 'Instant payouts',
      desc: 'No minimums, no 30-day holds. Move USDC to your wallet whenever you want.',
    },
  ];

  return (
    <div className="w-full" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-24 grid grid-cols-2 gap-16 items-center">
        {/* Earnings Card */}
        <div
          className="rounded-2xl p-7"
          style={{ backgroundColor: '#0b1220', boxShadow: '0 24px 64px rgba(11, 18, 32, 0.18)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: '#ffffff', opacity: 0.6 }}>
                March earnings
              </p>
              <p className="font-headings text-4xl font-bold mt-1" style={{ color: '#ffffff' }}>
                $4,820.75
              </p>
              <p className="text-sm mt-1.5 flex items-center gap-1.5" style={{ color: '#ffffff' }}>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#0ca16b', color: '#ffffff' }}
                >
                  +18%
                </span>
                <span style={{ opacity: 0.6 }}>vs last month</span>
              </p>
            </div>
            <div
              className="rounded-full px-3.5 py-2 text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}
            >
              USDC
            </div>
          </div>

          {/* Chart */}
          <div className="flex items-end gap-2 h-[130px] mt-7">
            {chartHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-md"
                style={{
                  height: `${h}%`,
                  backgroundColor: i === 11 ? '#0ca16b' : 'rgba(255,255,255,0.16)',
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ opacity: 0.5 }}>
            <span>Mar 1</span>
            <span>Mar 30</span>
          </div>

          {/* Recent Tips */}
          <div
            className="mt-5 pt-5 space-y-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
          >
            {supporters.map((supporter, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={supporter.avatar}
                    className="w-9 h-9 rounded-full"
                    alt={supporter.name}
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                      {supporter.name}
                    </p>
                    <p className="text-xs" style={{ opacity: 0.6 }}>
                      {supporter.handle}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                    {supporter.amount}
                  </p>
                  <p className="text-xs" style={{ opacity: 0.6 }}>
                    {supporter.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="w-full mt-5 text-sm font-semibold rounded-full py-3"
            type="button"
            style={{ backgroundColor: '#0ca16b', color: '#ffffff' }}
          >
            Withdraw to wallet
          </button>
        </div>

        {/* Text Content */}
        <div>
          <p className="text-sm font-semibold" style={{ color: '#0ca16b' }}>
            Creator dashboard
          </p>
          <h2
            className="font-headings text-4xl font-bold tracking-tight mt-3 leading-tight"
            style={{ color: '#0b1220' }}
          >
            Know exactly who loves your work
          </h2>
          <p className="text-base mt-4 leading-relaxed" style={{ color: '#64748b' }}>
            See every tip, every supporter, every payout — with receipts you can export at tax time.
          </p>

          <div className="space-y-4 mt-8">
            {dashboardFeatures.map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
                >
                  {i === 0 && '👥'}
                  {i === 1 && '📋'}
                  {i === 2 && '💰'}
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: '#0b1220' }}>
                    {feature.title}
                  </p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: '#64748b' }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="mt-8 text-sm font-semibold flex items-center gap-2 pb-1"
            type="button"
            style={{ color: '#0b1220', borderBottom: '2px solid #ffbf1f' }}
          >
            Explore the dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
