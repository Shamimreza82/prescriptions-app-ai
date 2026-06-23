import { z } from 'zod';

export const createMrSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(5, 'Phone number is required'),
  company: z.string().min(1, 'Company name is required'),
  department: z.string().optional(),
  designation: z.string().optional(),
});

const optStr = (min?: number) =>
  z.preprocess(
    (v) => (v === '' ? undefined : v),
    min ? z.string().min(min).optional() : z.string().optional()
  );

export const updateMrSchema = z.object({
  fullName: optStr(2),
  phone: optStr(5),
  company: optStr(1),
  department: optStr(),
  designation: optStr(),
});

export const assignDoctorsSchema = z.object({
  doctorIds: z.array(z.string().uuid()),
});

export const subscribeDoctorSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  transactionId: z.string().min(1, 'Transaction ID is required').optional(),
  notes: z.string().optional(),
});
