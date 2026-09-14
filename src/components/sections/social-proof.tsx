'use client';

export function SocialProof(): JSX.Element {
  const countries = [
    { country: 'USA', tips: '$428K' },
    { country: 'Indonesia', tips: '$312K' },
    { country: 'Brazil', tips: '$287K' },
    { country: 'Philippines', tips: '$201K' },
    { country: 'India', tips: '$189K' },
    { country: 'Mexico', tips: '$156K' },
  ];

  return (
    <div className="w-full border-y" style={{ backgroundColor: '#f7f9fc', borderColor: '#e6ebf2' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-24">
        {/* Header */}
        <div className="text-center max-w-[620px] mx-auto">
          <p className="text-sm font-semibold" style={{ color: '#0ca16b' }}>
            Love worldwide
          </p>
          <h2
            className="font-headings text-4xl font-bold tracking-tight mt-3"
            style={{ color: '#0b1220' }}
          >
            $2.4M tipped across 140 countries
          </h2>
          <p className="text-base mt-4" style={{ color: '#64748b' }}>
            From rural USA to Tokyo, creators are getting paid directly. No waiting, no banks
            rejecting them, no geo blocks.
          </p>
        </div>

        {/* Countries Grid */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          {countries.map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-base font-semibold" style={{ color: '#0b1220' }}>
                {item.country}
              </p>
              <p className="text-sm mt-1 font-semibold" style={{ color: '#0ca16b' }}>
                {item.tips}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
