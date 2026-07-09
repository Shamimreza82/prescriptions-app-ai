export interface ReceptionistDashboardData {
  totalPatients: number;
  totalPrescriptions: number;
  monthlyAppointments: number;
  monthlyPrescriptions: number;
  todaysPatients: number;
  todaysPrescriptions: number;
  monthlyData: number[];
}

export interface ReceptionistPatient {
  id: string;
  patientId: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  weight?: number;
  height?: number;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  previousDiseases?: string;
  emergencyContact?: string;
  createdAt: string;
  _count?: { prescriptions: number; appointments: number };
}

export interface CreatePatientInput {
  fullName: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  weight?: number;
  height?: number;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  previousDiseases?: string;
  emergencyContact?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  status: string;
  fee?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  notes?: string;
  patient?: { id: string; fullName: string; patientId: string; age?: number; gender?: string; phone?: string };
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
  medicines: any[];
  investigations: any[];
  advice?: string;
  foodAdvice?: string;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  patient?: any;
  doctor?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
