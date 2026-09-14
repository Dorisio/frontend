'use client';

export function LandingLogoStrip(): JSX.Element {
  return (
    <div
      className="w-full border-y"
      style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
    >
      <div className="max-w-[1200px] mx-auto px-8 py-7 flex items-center justify-between">
        <p className="text-sm font-medium whitespace-nowrap mr-8" style={{ color: '#64748b' }}>
          One link works everywhere
        </p>
        <div className="flex items-center gap-2" style={{ color: '#64748b' }}>
          X
        </div>
        <div className="flex items-center gap-2" style={{ color: '#64748b' }}>
          Instagram
        </div>
        <div className="flex items-center gap-2" style={{ color: '#64748b' }}>
          TikTok
        </div>
        <div className="flex items-center gap-2" style={{ color: '#64748b' }}>
          YouTube
        </div>
        <div className="flex items-center gap-2" style={{ color: '#64748b' }}>
          Twitch
        </div>
        <div className="flex items-center gap-2" style={{ color: '#64748b' }}>
          GitHub
        </div>
      </div>
    </div>
  );
}
