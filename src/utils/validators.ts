/**
 * Validation utilities
 * Functions for validating user input
 */

import { z } from 'zod';

/**
 * Validate Stellar public key format
 */
export function isValidStellarPublicKey(key: string): boolean {
  // Stellar public keys start with G and are 56 characters
  return /^G[A-Z2-7]{54}$/.test(key);
}

/**
 * Validate tip amount
 */
export function isValidTipAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0 && num <= 1_000_000;
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  // Allow alphanumeric, dots, hyphens, underscores, 3-30 chars
  return /^[a-zA-Z0-9._-]{3,30}$/.test(username);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * Zod schemas for form validation
 */
export const TipFormSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount cannot exceed $1,000,000')
    .multipleOf(0.01, 'Amount must be to 2 decimal places'),
  message: z
    .string()
    .max(500, 'Message cannot exceed 500 characters')
    .optional(),
  walletId: z.string().min(1, 'Please select a wallet'),
});

export type TipFormData = z.infer<typeof TipFormSchema>;

export const CreatorProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .refine(isValidUsername, 'Username can only contain letters, numbers, dots, hyphens, underscores'),
  displayName: z
    .string()
    .max(100, 'Display name cannot exceed 100 characters')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
});

export type CreatorProfileData = z.infer<typeof CreatorProfileSchema>;

export const LoginFormSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;

export const RegisterFormSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  role: z.enum(['fan', 'creator']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof RegisterFormSchema>;
