import { describe, expect, it } from 'vitest';
import {
  CreatorProfileSchema,
  LoginFormSchema,
  RegisterFormSchema,
  TipFormSchema,
} from './validators';

describe('validation schemas', () => {
  it('accepts valid tip, login, creator, and registration data', () => {
    expect(TipFormSchema.safeParse({ amount: 5, message: 'Thanks', walletId: 'wallet-1' }).success).toBe(true);
    expect(LoginFormSchema.safeParse({ email: 'creator@example.com', password: 'password123' }).success).toBe(true);
    expect(CreatorProfileSchema.safeParse({ username: 'creator_1', bio: 'Hello' }).success).toBe(true);
    expect(
      RegisterFormSchema.safeParse({
        email: 'creator@example.com',
        password: 'Password1',
        confirmPassword: 'Password1',
        name: 'Creator',
        role: 'creator',
      }).success
    ).toBe(true);
  });

  it('rejects invalid or incomplete form data with useful errors', () => {
    const tipResult = TipFormSchema.safeParse({ amount: 0, message: 'x'.repeat(501), walletId: '' });
    const creatorResult = CreatorProfileSchema.safeParse({ username: 'no' });
    const registerResult = RegisterFormSchema.safeParse({
      email: 'invalid',
      password: 'password',
      confirmPassword: 'different',
      name: 'A',
      role: 'creator',
    });

    expect(tipResult.success).toBe(false);
    expect(creatorResult.success).toBe(false);
    expect(registerResult.success).toBe(false);
    expect(registerResult.success ? [] : registerResult.error.issues.map((issue) => issue.path.join('.'))).toContain('confirmPassword');
  });
});
