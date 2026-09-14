/**
 * Dynamic OG Image API Route
 * Generates custom Open Graph images for creator profiles
 * Used by next/og to render dynamic social preview cards
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface CreatorData {
  displayName: string;
  bio: string;
  totalEarnings: number;
  avatar: string | null;
  verified: boolean;
}

async function fetchCreatorData(username: string): Promise<CreatorData | null> {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(
    //   `${process.env.NEXT_PUBLIC_API_URL}/creators/${username}`,
    //   { next: { revalidate: 3600 } }
    // );

    return {
      displayName: username,
      bio: 'Creator on Dorisio',
      totalEarnings: 1500,
      avatar: null,
      verified: false,
    };
  } catch (err) {
    console.error('Failed to fetch creator data:', err);
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
): Promise<ImageResponse | NextResponse> {
  try {
    const username = decodeURIComponent(params.username);
    const creator = await fetchCreatorData(username);

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const earningsDisplay = creator.totalEarnings
      ? `$${(creator.totalEarnings / 100).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : 'Just started';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage:
                'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '60px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'white',
                  border: '4px solid white',
                }}
              >
                {creator.displayName.charAt(0).toUpperCase()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1
                    style={{
                      fontSize: '56px',
                      fontWeight: 'bold',
                      color: 'white',
                      margin: 0,
                    }}
                  >
                    {creator.displayName}
                  </h1>
                  {creator.verified && (
                    <span style={{ fontSize: '32px', color: '#00ff00' }}>✓</span>
                  )}
                </div>
                {creator.bio && (
                  <p
                    style={{
                      fontSize: '24px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      margin: '12px 0 0 0',
                    }}
                  >
                    {creator.bio}
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '20px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Total Earnings
                </p>
                <p
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                  }}
                >
                  {earningsDisplay}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '24px',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                <span>Tip on</span>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '8px 24px',
                    borderRadius: '8px',
                  }}
                >
                  Dorisio
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error('OG image generation error:', err);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
