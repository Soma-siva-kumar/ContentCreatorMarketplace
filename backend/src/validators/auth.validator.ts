import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password is too long'),
    role: z.enum(['creator', 'brand'], {
      required_error: 'Role must be either creator or brand',
    }),
    displayName: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').optional(),
    industry: z.string().trim().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format')
      .trim()
      .toLowerCase(),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format')
      .trim()
      .toLowerCase(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Reset token is required' }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters long'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters long'),
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string({ required_error: 'Verification token is required' }),
  }),
});
