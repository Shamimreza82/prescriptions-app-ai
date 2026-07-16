import { z } from 'zod';

export const createPatientSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().int().positive('Age must be a positive number'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^01[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number (e.g., 01XXXXXXXXX)'),
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  previousDiseases: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();


