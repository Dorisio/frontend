import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInForm from '@/components/auth/signin-form';
import SignUpForm from '@/components/auth/signup-form';
import { InlineFormError } from '@/components/shared/inline-form-error';
import { getFriendlyErrorMessage } from '@/components/auth/form-error-mapper';

describe('Inline Form Validation Error Display (#162)', () => {
  describe('InlineFormError component', () => {
    it('renders null when message is undefined or empty', () => {
      const { container } = render(<InlineFormError id="test-error" message="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders an accessible alert container with aria attributes', () => {
      render(<InlineFormError id="test-error" message="Invalid value provided" />);

      const error = screen.getByRole('alert');
      expect(error).toBeInTheDocument();
      expect(error).toHaveAttribute('id', 'test-error');
      expect(error).toHaveAttribute('aria-live', 'polite');
      expect(error).toHaveTextContent('Invalid value provided');
    });
  });

  describe('Form error message mapping', () => {
    it('maps email validation errors to user-friendly actionable text', () => {
      expect(getFriendlyErrorMessage('email', 'Invalid email address')).toBe(
        'Please enter a valid email address (e.g., you@example.com)'
      );
      expect(getFriendlyErrorMessage('email', 'Required')).toBe('Email address is required');
    });

    it('maps name validation errors to user-friendly actionable text', () => {
      expect(getFriendlyErrorMessage('name', 'Name must be at least 2 characters')).toBe(
        'Full name must be at least 2 characters'
      );
    });

    it('maps password and password mismatch validation errors', () => {
      expect(getFriendlyErrorMessage('password', 'Password must be at least 6 characters')).toBe(
        'Password must be at least 6 characters'
      );
      expect(getFriendlyErrorMessage('password', 'Password must be at least 8 characters')).toContain(
        'Password must be at least 8 characters'
      );
      expect(getFriendlyErrorMessage('confirmPassword', "Passwords don't match")).toContain(
        "Passwords don't match"
      );
    });
  });

  describe('SignInForm validation & accessibility', () => {
    it('initial inputs have aria-invalid="false" and no aria-describedby', () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      expect(emailInput).not.toHaveAttribute('aria-describedby');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
      expect(passwordInput).not.toHaveAttribute('aria-describedby');
    });

    it('shows inline errors with role="alert" and aria attributes on empty submit', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(2);
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();

      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    it('focuses the first invalid field on form submit', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText(/email/i);
      await waitFor(() => {
        expect(document.activeElement).toBe(emailInput);
      });
    });

    it('focuses password field if email is valid but password is missing', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'valid@example.com');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
        expect(document.activeElement).toBe(passwordInput);
      });
    });
  });

  describe('SignUpForm validation & accessibility', () => {
    it('initial inputs have aria-invalid="false"', () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('aria-invalid', 'false');
    });

    it('displays inline errors for all invalid fields on empty submit', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/full name/i);
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      expect(document.activeElement).toBe(nameInput);
    });

    it('displays inline error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/full name/i), 'Alice Example');
      await user.type(screen.getByLabelText(/^email$/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      const confirmInput = screen.getByLabelText(/confirm password/i);
      expect(confirmInput).toHaveAttribute('aria-invalid', 'true');
      expect(confirmInput).toHaveAttribute('aria-describedby', 'confirmPassword-error');
      expect(document.activeElement).toBe(confirmInput);
    });
  });
});
