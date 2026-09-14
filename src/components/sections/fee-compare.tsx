'use client';

export function FeeCompare(): JSX.Element {
  return (
    <div className="w-full border-y" style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-24 grid grid-cols-2 gap-14 items-center">
        {/* Left: Fee Comparison */}
        <div>
          <p className="text-sm font-semibold" style={{ color: '#0ca16b' }}>
            Fees
          </p>
          <h2
            className="font-headings text-4xl font-bold tracking-tight mt-3"
            style={{ color: '#0b1220' }}
          >
            Keep 99.9% of every tip
          </h2>
          <p className="text-base mt-4 leading-relaxed" style={{ color: '#64748b' }}>
            Other platforms take up to a third. Stellar transactions cost a fraction of a cent — so
            we pass almost everything to creators.
          </p>

          <div className="mt-8 space-y-3.5">
            {/* Dorisio */}
            <div
              className="border rounded-xl p-5"
              style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
            >
              <div className="flex justify-between text-sm font-semibold">
                <span style={{ color: '#0b1220' }}>Dorisio</span>
                <span style={{ color: '#0ca16b' }}>0.1% + $0.0005</span>
              </div>
              <div
                className="h-2.5 rounded-full mt-3 overflow-hidden"
                style={{ backgroundColor: '#f2f5f8' }}
              >
                <div
                  className="h-full w-[4%] rounded-full"
                  style={{ backgroundColor: '#0ca16b' }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                On a $10 tip, the creator gets $9.99
              </p>
            </div>

            {/* Typical Platform */}
            <div
              className="border rounded-xl p-5"
              style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2', opacity: 0.7 }}
            >
              <div className="flex justify-between text-sm font-semibold">
                <span style={{ color: '#0b1220' }}>Typical donation platform</span>
                <span>5 – 12%</span>
              </div>
              <div
                className="h-2.5 rounded-full mt-3 overflow-hidden"
                style={{ backgroundColor: '#f2f5f8' }}
              >
                <div
                  className="h-full w-[42%] rounded-full"
                  style={{ backgroundColor: '#64748b' }}
                />
              </div>
            </div>

            {/* Video Platform */}
            <div
              className="border rounded-xl p-5"
              style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2', opacity: 0.7 }}
            >
              <div className="flex justify-between text-sm font-semibold">
                <span style={{ color: '#0b1220' }}>Video platform cut</span>
                <span>30 – 50%</span>
              </div>
              <div
                className="h-2.5 rounded-full mt-3 overflow-hidden"
                style={{ backgroundColor: '#f2f5f8' }}
              >
                <div
                  className="h-full w-[78%] rounded-full"
                  style={{ backgroundColor: '#64748b' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Calculator */}
        <div
          className="border rounded-2xl p-8"
          style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
        >
          <div
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: '#0b1220' }}
          >
            🧮 Tip calculator
          </div>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>
            Slide a tip amount, see what the creator keeps.
          </p>

          <p className="font-headings text-5xl font-bold mt-6" style={{ color: '#0b1220' }}>
            $25
          </p>

          {/* Slider */}
          <div className="h-2 rounded-full mt-4 relative" style={{ backgroundColor: '#f2f5f8' }}>
            <div
              className="absolute inset-y-0 left-0 w-1/3 rounded-full"
              style={{ backgroundColor: '#0ca16b' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 left-1/3 w-6 h-6 rounded-full border-[3px]"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#0ca16b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: '#64748b' }}>
            <span>$1</span>
            <span>$100</span>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#e7f6ee' }}>
              <p className="text-xs font-semibold" style={{ color: '#0a6b48' }}>
                Creator receives
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#0b1220' }}>
                $24.97
              </p>
            </div>
            <div
              className="border rounded-xl p-4"
              style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}
            >
              <p className="text-xs font-semibold" style={{ color: '#64748b' }}>
                Network fee
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#0b1220' }}>
                $0.03
              </p>
            </div>
          </div>

          <button
            className="w-full mt-5 text-sm font-semibold rounded-full py-3.5"
            type="button"
            style={{ backgroundColor: '#0b1220', color: '#ffffff' }}
          >
            Start tipping free
          </button>
          <p className="text-xs text-center mt-3" style={{ color: '#64748b' }}>
            No account needed to send your first tip
          </p>
        </div>
      </div>
    </div>
  );
}
