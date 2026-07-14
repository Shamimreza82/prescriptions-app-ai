import { z } from 'zod';

export const chamberSlotSchema = z.object({
  day: z.string().min(1, 'Day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

const schedulePermissive: z.ZodType<any[]> = z.array(z.any());

export const doctorProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Valid phone is required'),
  degree: z.array(z.string()).min(1, 'At least one degree is required'),
  specialization: z.array(z.string()).min(1, 'At least one specialization is required'),
  bmdcRegNo: z.string().min(1, 'BMDC Reg No is required').max(8, 'BMDC Reg No must not exceed 8 characters'),
  clinicName: z.string().min(1, 'Clinic name is required'),
  clinicAddress: z.string().min(1, 'Clinic address is required'),
  chamberSchedule: schedulePermissive,
  feesNewVisit: z.coerce.number({ invalid_type_error: 'New visit fee is required' }).min(0, 'Fee must be a positive number'),
  feesFollowUp: z.coerce.number({ invalid_type_error: 'Follow-up fee is required' }).min(0, 'Fee must be a positive number'),
});

export type DoctorProfileFormData = z.infer<typeof doctorProfileSchema>;
