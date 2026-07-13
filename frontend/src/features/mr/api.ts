import { api } from '@/lib/axios';

export const getMyProfile = () =>
  api.get('/mr/my-profile').then((r) => r.data.data);

export const updateMyProfile = (data: { fullName?: string; phone?: string; company?: string; department?: string; designation?: string }) =>
  api.put('/mr/my-profile', data).then((r) => r.data.data);

export const getMyDoctors = (params?: { page?: number; limit?: number; search?: string; sortPrescriptions?: string }) =>
  api.get('/mr/doctors', { params }).then((r) => r.data);

export const getDoctorPrescriptions = (doctorId: string, params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }) =>
  api.get(`/mr/doctors/${doctorId}/prescriptions`, { params }).then((r) => r.data);

export const getDashboardStats = () =>
  api.get('/mr/dashboard').then((r) => r.data.data);

export const getDoctorPrescriptionById = (doctorId: string, prescriptionId: string) =>
  api.get(`/mr/doctors/${doctorId}/prescriptions/${prescriptionId}`).then((r) => r.data.data);

export const getAvailableDoctors = () =>
  api.get('/mr/available-doctors').then((r) => r.data.data);

export const getMrs = (params?: { page?: number; limit?: number; search?: string; status?: string; verified?: string; role?: string }) =>
  api.get('/mr', { params }).then((r) => r.data);

export const createMr = (data: { email: string; password: string; fullName: string; phone: string; company: string; department?: string; designation?: string }) =>
  api.post('/mr', data).then((r) => r.data.data);

export const updateMr = (id: string, data: { fullName?: string; phone?: string; company?: string; department?: string; designation?: string }) =>
  api.put(`/mr/${id}`, data).then((r) => r.data.data);

export const deleteMr = (id: string) =>
  api.delete(`/mr/${id}`).then((r) => r.data.data);

export const assignDoctors = (mrId: string, data: { doctorIds: string[] }) =>
  api.post(`/mr/${mrId}/assign`, data).then((r) => r.data.data);

export const getMrSubscriptions = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/mr/subscriptions', { params }).then((r) => r.data);

export const subscribeDoctor = (doctorId: string, data: { planId: string; transactionId?: string; notes?: string }) =>
  api.post(`/mr/doctors/${doctorId}/subscribe`, data).then((r) => r.data.data);

export const getReportsOverview = () =>
  api.get('/mr/reports/overview').then((r) => r.data.data);

export const getReportsPrescriptions = (params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string; status?: string }) =>
  api.get('/mr/reports/prescriptions', { params }).then((r) => r.data);

export const getReportsMedicines = (params?: { page?: number; limit?: number; doctorId?: string }) =>
  api.get('/mr/reports/medicines', { params }).then((r) => r.data.data);

export const getReportsRevenue = (params?: { page?: number; limit?: number }) =>
  api.get('/mr/reports/revenue', { params }).then((r) => r.data.data);

// ── Audit API ──────────────────────────────────────────────────────

export const getAuditOverview = () =>
  api.get('/mr/audit/overview').then((r) => r.data.data);

export const getAuditDoctors = (params?: { page?: number; limit?: number }) =>
  api.get('/mr/audit/doctors', { params }).then((r) => r.data);

export const getAuditMedicines = (params?: { page?: number; limit?: number }) =>
  api.get('/mr/audit/medicines', { params }).then((r) => r.data);

export const getAuditTrends = (params?: { doctorId?: string; medicineName?: string }) =>
  api.get('/mr/audit/trends', { params }).then((r) => r.data.data);

// ── Tracked Medicines API ──────────────────────────────────────────

export const listTrackedMedicines = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/mr/audit/tracked-medicines', { params }).then((r) => r.data);

export const addTrackedMedicine = (data: { name: string; genericName?: string; strength?: string; form?: string }) =>
  api.post('/mr/audit/tracked-medicines', data).then((r) => r.data.data);

export const toggleTrackedMedicine = (id: string) =>
  api.patch(`/mr/audit/tracked-medicines/${id}/toggle`).then((r) => r.data.data);

export const removeTrackedMedicine = (id: string) =>
  api.delete(`/mr/audit/tracked-medicines/${id}`).then((r) => r.data.data);
