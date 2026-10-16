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

const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm(): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    shouldFocusError: true,
  });

  const onSubmit = async (data: SignUpFormData): Promise<void> => {
    setError(null);
    try {
      console.log('Sign up:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  const onInvalid = (formErrors: FieldErrors<SignUpFormData>) => {
    const firstKey = Object.keys(formErrors)[0] as keyof SignUpFormData;
    if (firstKey) {
      setFocus(firstKey);
      document.getElementById(firstKey)?.focus();
    }
  };

  return (
    <AuthForm
      title="Create Account"
      description="Join thousands of creators and supporters"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-4">
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
            {...register('name')}
            disabled={isSubmitting}
          />
          <InlineFormError
            id="name-error"
            message={getFriendlyErrorMessage('name', errors.name?.message)}
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
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
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            className={cn(errors.confirmPassword && 'border-destructive focus-visible:ring-destructive')}
            {...register('confirmPassword')}
            disabled={isSubmitting}
          />
          <InlineFormError
            id="confirmPassword-error"
            message={getFriendlyErrorMessage('confirmPassword', errors.confirmPassword?.message)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : 'Create Account'}
        </Button>
      </form>
    </AuthForm>
  );
}
