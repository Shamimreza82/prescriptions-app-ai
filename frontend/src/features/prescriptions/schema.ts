import { z } from 'zod';

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  strength: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
});

const investigationSchema = z.object({
  name: z.string().min(1, 'Investigation name is required'),
  notes: z.string().optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().uuid('Select a patient'),
  symptoms: z.string().optional(),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  diagnosisNotes: z.string().optional(),
  bloodPressure: z.string().optional(),
  pulseRate: z.string().optional(),
  temperature: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  medicines: z.array(medicineSchema).min(1, 'Add at least one medicine'),
  investigations: z.array(investigationSchema).optional(),
  advice: z.string().optional(),
  foodAdvice: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});
