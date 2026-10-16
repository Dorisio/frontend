/**
 * Maps Zod validation error messages to specific, user-friendly, actionable messages.
 */
export function getFriendlyErrorMessage(fieldName: string, rawMessage?: string): string {
  if (!rawMessage) return '';

  const lower = rawMessage.toLowerCase();

  switch (fieldName) {
    case 'email':
      if (lower.includes('invalid') || lower.includes('email')) {
        return 'Please enter a valid email address (e.g., you@example.com)';
      }
      if (lower.includes('required') || lower.includes('expected string')) {
        return 'Email address is required';
      }
      return rawMessage;

    case 'name':
      if (lower.includes('at least 2') || lower.includes('characters')) {
        return 'Full name must be at least 2 characters';
      }
      if (lower.includes('required') || lower.includes('expected string')) {
        return 'Full name is required';
      }
      return rawMessage;

    case 'password':
      if (lower.includes('6')) {
        return 'Password must be at least 6 characters';
      }
      if (lower.includes('8') || lower.includes('12')) {
        return 'Password must be at least 8 characters with uppercase, lowercase, number, or special character';
      }
      if (lower.includes('required') || lower.includes('expected string')) {
        return 'Password is required';
      }
      return rawMessage;

    case 'confirmPassword':
      if (lower.includes("don't match") || lower.includes('match')) {
        return "Passwords don't match. Please re-enter your password to confirm";
      }
      if (lower.includes('required') || lower.includes('expected string')) {
        return 'Please confirm your password';
      }
      return rawMessage;

    default:
      return rawMessage;
  }
}
