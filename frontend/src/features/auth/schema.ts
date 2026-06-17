import { z } from 'zod';

// 1. Define shared fields to avoid repeating logic
const emailField = z
  .string()
  .min(1, 'Email is required')
  .trim()
  .toLowerCase()
  .email('Enter a valid email address');

const passwordField = z
  .string()
  .min(6, 'Password must be at least 6 characters long');

// 2. Login Schema
export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type LoginInput = z.infer<typeof loginSchema>;

// 3. Register Schema (Extends Login Schema)
export const registerSchema = loginSchema
  .extend({
    fullName: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;