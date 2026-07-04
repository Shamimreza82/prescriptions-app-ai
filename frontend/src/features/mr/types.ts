export interface Mr {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  company: string;
  department?: string;
  designation?: string;
  user?: { id: string; email: string; isActive: boolean; createdAt: string };
  doctors?: DoctorAssignment[];
  _count?: { doctors: number };
}

export interface DoctorAssignment {
  id: string;
  doctorId: string;
  doctor: {
    id: string;
    fullName: string;
    clinicName: string;
    degree?: string[];
    specialization?: string[];
    phone?: string;
    user?: { email: string; isActive: boolean };
    _count?: { patients: number; prescriptions: number };
  };
}

export interface CreateMrInput {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  company: string;
  department?: string;
  designation?: string;
}

export interface AssignDoctorsInput {
  doctorIds: string[];
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  patientLimit: number;
  prescriptionLimit: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsOverview {
  totalDoctors: number;
  totalPrescriptions: number;
  todaysPrescriptions: number;
  thisMonthPrescriptions: number;
  monthlyPrescriptions: number[];
  monthlyLabels: string[];
}

export interface TopMedicine {
  name: string;
  strength: string | null;
  form: string | null;
  genericName: string | null;
  _count: { _all: number };
}

export interface ReportsMedicines {
  medicines: TopMedicine[];
  total: number;
  totalPrescriptions: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  transactionId: string;
  notes?: string;
  createdAt: string;
  subscription: {
    doctor: { id: string; fullName: string; clinicName: string };
    plan: { id: string; name: string };
  };
}

export interface ReportsRevenue {
  monthlyRevenue: number[];
  monthlyLabels: string[];
  payments: ReportPayment[];
}

export interface MrSubscription {
  doctor: {
    id: string;
    fullName: string;
    clinicName: string;
    degree?: string[];
    specialization?: string[];
    phone?: string;
    bmdcRegNo?: string;
    _count?: { patients: number; prescriptions: number };
  };
  subscription: {
    id: string;
    planId: string;
    status: string;
    patientLimit: number;
    prescriptionLimit: number;
    startDate: string;
    endDate: string | null;
    plan: Plan;
    payments?: Array<{ id: string; transactionId: string; status: string; amount: number; notes?: string }>;
  } | null;
  plans: Plan[];
}
