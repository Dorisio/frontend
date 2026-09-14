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

export async function generateMetadata(
  { params }: CreatorLayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const username = params.username;

  // Fetch creator data from the backend
  // Note: Replace this with your actual API endpoint
  let creator = null;
  let error = null;

  try {
    // This would typically call your API
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creators/${username}`);
    // if (response.ok) {
    //   creator = await response.json();
    // }
  } catch (err) {
    error = err;
  }

  if (!creator) {
    return {
      title: `${username} | Dorisio`,
      description: 'Support your favorite creators on Dorisio',
    };
  }

  const title = `${creator.displayName} (@${creator.username}) | Dorisio`;
  const description =
    creator.bio ||
    `Support ${creator.displayName} on Dorisio. ${creator.displayName} has earned ${creator.totalEarnings} from tips.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dorisio.io'}/creators/${username}`,
      siteName: 'Dorisio',
      images: creator.avatar
        ? [
            {
              url: creator.avatar,
              width: 400,
              height: 400,
              alt: creator.displayName,
              type: 'image/jpeg',
            },
          ]
        : [
            {
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dorisio.io'}/og-image.png`,
              width: 1200,
              height: 630,
              alt: 'Dorisio',
              type: 'image/png',
            },
          ],
      profile: {
        firstName: creator.displayName?.split(' ')[0],
        lastName: creator.displayName?.split(' ').slice(1).join(' ') || undefined,
        username: creator.username,
      },
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: creator.avatar ? [creator.avatar] : undefined,
      creator: creator.twitterHandle ? `@${creator.twitterHandle}` : undefined,
    },
    other: {
      'og:type': 'profile',
      'og:profile:username': creator.username,
    },
  };
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  return <>{children}</>;
}
