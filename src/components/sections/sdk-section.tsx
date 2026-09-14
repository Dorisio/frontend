'use client';

export function SdkSection(): JSX.Element {
  const features = [
    {
      title: 'REST API',
      desc: 'Full control over the tipping experience. Build custom UIs, handle webhooks, query history.',
    },
    {
      title: 'Embed widget',
      desc: 'Drop a single script tag into your site. Handles everything — UI, payments, error handling.',
    },
    {
      title: 'Open source SDKs',
      desc: 'JS/TS, Python, Go. Integrate into apps, bots, dashboards. MIT licensed.',
    },
  ];

  const codeExample = `import Dorisio from '@dorisio/js'

const dorisio = new Dorisio({
  apiKey: 'key_live_...'
})

// Send a tip
await dorisio.tips.create({
  amount: 5,
  creator: 'maya',
  currency: 'USDC',
  message: 'Love your content!'
})

// Webhooks ready
dorisio.webhooks.on('tip.created',
  (event) => console.log(event)
)`;

  return (
    <div className="w-full" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-24 grid grid-cols-2 gap-14 items-center">
        {/* Left: Text Content */}
        <div>
          <p className="text-sm font-semibold" style={{ color: '#0ca16b' }}>
            Developers
          </p>
          <h2
            className="font-headings text-4xl font-bold tracking-tight mt-3"
            style={{ color: '#0b1220' }}
          >
            Drop tips anywhere
          </h2>
          <p className="text-base mt-4 leading-relaxed" style={{ color: '#64748b' }}>
            Embed a tipping button, build a custom experience, or integrate via API. A few lines of
            code, zero KYC.
          </p>

          <div className="space-y-4 mt-8">
            {features.map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: '#e7f6ee', color: '#0ca16b' }}
                >
                  {i === 0 && '⚙️'}
                  {i === 1 && '🔌'}
                  {i === 2 && '📦'}
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
            View API docs →
          </button>
        </div>

        {/* Right: Code Block */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#0b1220' }}>
          <div
            className="font-mono text-xs leading-relaxed overflow-auto max-h-96"
            style={{ color: '#ffffff' }}
          >
            <pre>{codeExample}</pre>
          </div>
          <button
            className="w-full mt-6 text-sm font-semibold rounded-full py-3"
            type="button"
            style={{ backgroundColor: '#0ca16b', color: '#ffffff' }}
          >
            Explore docs
          </button>
        </div>
      </div>
    </div>
  );
}
