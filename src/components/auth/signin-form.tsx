'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthForm } from '@/components/auth/auth-form';
import { ErrorMessage } from '@/components/shared/error-message';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { InlineFormError } from '@/components/shared/inline-form-error';
import { getFriendlyErrorMessage } from '@/components/auth/form-error-mapper';
import { cn } from '@/lib/utils';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInForm(): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    shouldFocusError: true,
  });

  const onSubmit = async (data: SignInFormData): Promise<void> => {
    setError(null);
    try {
      console.log('Sign in:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  const onInvalid = (formErrors: FieldErrors<SignInFormData>) => {
    const firstKey = Object.keys(formErrors)[0] as keyof SignInFormData;
    if (firstKey) {
      setFocus(firstKey);
      document.getElementById(firstKey)?.focus();
    }
  };

  return (
    <AuthForm
      title="Sign In"
      description="Welcome back! Sign in to your account"
      footer={
        <>
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-4">
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
            {...register('email')}
            disabled={isSubmitting}
          />
          <InlineFormError
            id="email-error"
            message={getFriendlyErrorMessage('email', errors.email?.message)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={cn(errors.password && 'border-destructive focus-visible:ring-destructive')}
            {...register('password')}
            disabled={isSubmitting}
          />
          <InlineFormError
            id="password-error"
            message={getFriendlyErrorMessage('password', errors.password?.message)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : 'Sign In'}
        </Button>
      </form>
    </AuthForm>
  );
}
