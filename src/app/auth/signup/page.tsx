/**
 * Sign Up Page
 */

'use client';

import dynamic from 'next/dynamic';

const SignUpForm = dynamic(() => import('@/components/auth/signup-form'), {
  ssr: false,
  loading: () => <div className="min-h-[32rem]" />,
});

export default function SignUpPage(): JSX.Element {
  return <SignUpForm />;
}
