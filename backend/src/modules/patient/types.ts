export interface CreatePatientInput {
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
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

export interface UpdatePatientInput extends Partial<CreatePatientInput> {}


