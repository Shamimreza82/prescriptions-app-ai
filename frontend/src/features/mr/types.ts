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
  paymentsTotal: number;
  paymentsPage: number;
  paymentsTotalPages: number;
}

export interface ExpiringSubscription {
  doctorId: string;
  doctorName: string;
  planName: string;
  daysLeft: number;
}

export interface TopDoctorInfo {
  id: string;
  fullName: string;
  clinicName: string;
  prescriptionCount: number;
}

export interface RecentActivityItem {
  type: string;
  patientName: string;
  doctorName: string;
  createdAt: string;
}

export interface DashboardStats {
  totalDoctors: number;
  todaysPrescriptions: number;
  totalPrescriptions: number;
  thisMonthPrescriptions: number;
  activeSubscriptions: number;
  noSubscription: number;
  weeklyPrescriptions: number[];
  weeklyLabels: string[];
  expiringSoon: ExpiringSubscription[];
  topDoctors: TopDoctorInfo[];
  recentActivity: RecentActivityItem[];
}

// ── Audit Types ────────────────────────────────────────────────────

export interface TrackedMedicine {
  id: string;
  mrId: string;
  name: string;
  genericName: string | null;
  strength: string | null;
  form: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MrAuditOverview {
  trackedMedicinesCount: number;
  activeTrackedMedicinesCount: number;
  doctorsPrescribingTracked: number;
  totalTrackedPrescriptions: number;
  topTrackedMedicine: { name: string; count: number } | null;
  thisMonthTracked: number;
  lastMonthTracked: number;
  trendPercent: number;
}

export interface MrAuditDoctor {
  doctorId: string;
  doctorName: string;
  clinicName: string;
  totalPrescriptions: number;
  trackedPrescriptions: number;
  engagementPercent: number;
  lastPrescriptionDate: string | null;
  trend: 'up' | 'down' | 'flat';
}

export interface MrAuditMedicine {
  name: string;
  genericName: string | null;
  strength: string | null;
  form: string | null;
  totalPrescriptions: number;
  doctorsCount: number;
  trend: 'up' | 'down' | 'flat';
}

export interface MrAuditTrend {
  month: string;
  count: number;
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
