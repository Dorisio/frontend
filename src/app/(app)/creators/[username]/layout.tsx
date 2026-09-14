/**
 * Creator Profile Layout
 * Handles dynamic metadata generation for OpenGraph tags
 */

import { Metadata, ResolvingMetadata } from 'next';

interface CreatorLayoutProps {
  children: React.ReactNode;
  params: {
    username: string;
  };
}

interface Creator {
  displayName: string;
  username: string;
  bio: string;
  totalEarnings: number;
  twitterHandle?: string;
}

export async function generateMetadata(
  { params }: CreatorLayoutProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const username = params.username;

  // Fetch creator data from the backend
  // Note: Replace this with your actual API endpoint
  let creator: Creator | null = null;

  try {
    // This would typically call your API
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creators/${username}`);
    // if (response.ok) {
    //   creator = await response.json();
    // }
  } catch {
    // Error handling - continue with null creator
  }

  if (!creator) {
    return {
      title: `${username} | Dorisio`,
      description: 'Support your favorite creators on Dorisio',
    };
  }

  // After the guard, TypeScript should understand creator is Creator, not null
  const creatorData = creator as Creator;
  const title = `${creatorData.displayName} (@${creatorData.username}) | Dorisio`;
  const description =
    creatorData.bio ||
    `Support ${creatorData.displayName} on Dorisio. ${creatorData.displayName} has earned ${creatorData.totalEarnings} from tips.`;

  // Dynamic OG image URL
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dorisio.io'}/api/og/creator/${encodeURIComponent(username)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dorisio.io'}/creators/${username}`,
      siteName: 'Dorisio',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: creatorData.displayName,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: creatorData.twitterHandle ? `@${creatorData.twitterHandle}` : undefined,
    },
  };
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  return <>{children}</>;
}
