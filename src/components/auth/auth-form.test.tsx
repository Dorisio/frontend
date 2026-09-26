import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthForm } from './auth-form';

describe('AuthForm', () => {
  it('renders title, description, fields, and footer accessibly', () => {
    render(
      <AuthForm title="Sign In" description="Welcome back" footer={<a href="/signup">Sign up</a>}>
        <label htmlFor="email">Email</label>
        <input id="email" />
      </AuthForm>
    );

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });

  it('omits optional description and footer when not provided', () => {
    render(
      <AuthForm title="Reset password">
        <p>Form content</p>
      </AuthForm>
    );

    expect(screen.getByRole('heading', { name: 'Reset password' })).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });
});
