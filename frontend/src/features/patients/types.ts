export interface Patient {
  id: string;
  patientId: string;
  doctorId?: string;
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
  prescriptions?: any[];
  appointments?: any[];
}

export interface CreatePatientInput {
  fullName: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  weight?: number;
  height?: number;
  phone: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  previousDiseases?: string;
  emergencyContact?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
