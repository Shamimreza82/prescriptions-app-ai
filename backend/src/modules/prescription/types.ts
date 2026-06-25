export interface MedicineInput {
  name: string;
  strength: string;
  dosage: string;
  frequency?: string;
  duration: string;
  instructions?: string;
}

export interface InvestigationInput {
  name: string;
  notes?: string;
}

export interface CreatePrescriptionInput {
  patientId: string;
  symptoms?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  diagnosisNotes?: string;
  bloodPressure?: string;
  pulseRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
  medicines: MedicineInput[];
  investigations?: InvestigationInput[];
  advice?: string;
  foodAdvice?: string;
  followUpDate?: string;
  notes?: string;
}

export interface UpdatePrescriptionInput extends Partial<CreatePrescriptionInput> {}
