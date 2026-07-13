export interface CreateMrInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  company: string;
  department?: string;
  designation?: string;
}

export interface UpdateMrInput {
  fullName?: string;
  phone?: string;
  company?: string;
  department?: string;
  designation?: string;
}

export interface AssignDoctorsInput {
  doctorIds: string[];
}

export interface SubscribeDoctorInput {
  planId: string;
  transactionId?: string;
  notes?: string;
}

export interface CreateTrackedMedicineInput {
  name: string;
  genericName?: string;
  strength?: string;
  form?: string;
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
