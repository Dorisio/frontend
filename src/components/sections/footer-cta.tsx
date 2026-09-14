'use client';

export function FooterCta(): JSX.Element {
  return (
    <div className="w-full" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-24">
        <div
          className="rounded-2xl p-16 text-center border"
          style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}
        >
          <h2
            className="font-headings text-5xl font-bold tracking-tight"
            style={{ color: '#0b1220' }}
          >
            Ready to tip, or to get tipped?
          </h2>
          <p
            className="text-base mt-4 max-w-[620px] mx-auto leading-relaxed"
            style={{ color: '#64748b' }}
          >
            Join 48K+ supporters and 2.8K+ creators earning on Dorisio. No signup fees, no platform
            cuts. Just instant money moving.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              className="text-sm font-semibold px-8 py-4 rounded-full flex items-center gap-2"
              type="button"
              style={{ backgroundColor: '#0ca16b', color: '#ffffff' }}
            >
              Find a creator →
            </button>
            <button
              className="border text-sm font-semibold px-8 py-4 rounded-full"
              type="button"
              style={{ borderColor: '#e6ebf2', color: '#0b1220' }}
            >
              Claim your page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
