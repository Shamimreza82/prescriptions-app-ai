export interface Medicine {
  name: string;
  strength?: string;
  form?: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Investigation {
  name: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  doctorId: string;
  symptoms?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  diagnosisNotes?: string;
  bloodPressure?: string;
  pulseRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
  medicines: Medicine[];
  investigations: Investigation[];
  advice?: string;
  foodAdvice?: string;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  patient?: any;
  doctor?: any;
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
  medicines: Medicine[];
  investigations?: Investigation[];
  advice?: string;
  foodAdvice?: string;
  followUpDate?: string;
  notes?: string;
}
