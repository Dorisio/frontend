/**
 * Sign In Page
 */

'use client';

import dynamic from 'next/dynamic';

const SignInForm = dynamic(() => import('@/components/auth/signin-form'), {
  ssr: false,
  loading: () => <div className="min-h-[24rem]" />,
});

export default function SignInPage(): JSX.Element {
  return <SignInForm />;
}
