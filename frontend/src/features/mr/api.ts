import { api } from '@/lib/axios';

export const getMyDoctors = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/mr/doctors', { params }).then((r) => r.data);

export const getDoctorPatients = (doctorId: string) =>
  api.get(`/mr/doctors/${doctorId}/patients`).then((r) => r.data.data);

export const getDoctorPrescriptions = (doctorId: string, params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }) =>
  api.get(`/mr/doctors/${doctorId}/prescriptions`, { params }).then((r) => r.data);

export const getDashboardStats = () =>
  api.get('/mr/dashboard').then((r) => r.data.data);

export const getDoctorPrescriptionById = (doctorId: string, prescriptionId: string) =>
  api.get(`/mr/doctors/${doctorId}/prescriptions/${prescriptionId}`).then((r) => r.data.data);

export const getDoctorPrescriptionPdfUrl = (doctorId: string, prescriptionId: string) =>
  `/mr/doctors/${doctorId}/prescriptions/${prescriptionId}/pdf`;

export const getAvailableDoctors = () =>
  api.get('/mr/available-doctors').then((r) => r.data.data);

export const getMrs = (params?: { page?: number; limit?: number; search?: string; status?: string; verified?: string; role?: string }) =>
  api.get('/mr', { params }).then((r) => r.data);

export const getMrById = (id: string) =>
  api.get(`/mr/${id}`).then((r) => r.data.data);

export const createMr = (data: { email: string; password: string; fullName: string; phone: string }) =>
  api.post('/mr', data).then((r) => r.data.data);

export const updateMr = (id: string, data: { fullName?: string; phone?: string }) =>
  api.put(`/mr/${id}`, data).then((r) => r.data.data);

export const deleteMr = (id: string) =>
  api.delete(`/mr/${id}`).then((r) => r.data.data);

export const assignDoctors = (mrId: string, data: { doctorIds: string[] }) =>
  api.post(`/mr/${mrId}/assign`, data).then((r) => r.data.data);
