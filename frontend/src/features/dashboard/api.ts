import { api } from '@/lib/axios';
import { DoctorDashboardData, AdminDashboardData } from './types';

export const getDoctorDashboard = () =>
  api.get<{ success: boolean; data: DoctorDashboardData }>('/stats/doctor').then((r) => r.data.data);

export const getAdminDashboard = () =>
  api.get<{ success: boolean; data: AdminDashboardData }>('/stats/admin').then((r) => r.data.data);

export const getAdminDoctors = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/stats/admin/doctors', { params }).then((r) => r.data);

export const getAdminUsers = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/stats/admin/users', { params }).then((r) => r.data);

export const getAdminSubscriptions = (params?: { page?: number; limit?: number; search?: string; status?: string; planId?: string }) =>
  api.get('/stats/admin/subscriptions', { params }).then((r) => r.data);

export const getAdminPatients = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/stats/admin/patients', { params }).then((r) => r.data);

export const getAdminLogs = (params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }) =>
  api.get('/stats/logs', { params }).then((r) => r.data);

export const deleteAdminLogs = (startDate: string, endDate: string) =>
  api.delete('/stats/logs', { params: { startDate, endDate } }).then((r) => r.data);

export const getAdminUser = (userId: string) =>
  api.get<{ success: boolean; data: any }>(`/admin/users/${userId}`).then((r) => r.data.data);

export const toggleUserStatus = (userId: string) =>
  api.patch(`/admin/users/${userId}/status`).then((r) => r.data);

export const clearDoctorMrAssignments = (doctorId: string) =>
  api.post(`/admin/doctors/${doctorId}/clear-mr`).then((r) => r.data);

export const resetUserPassword = (userId: string, newPassword: string) =>
  api.post(`/admin/users/${userId}/reset-password`, { newPassword }).then((r) => r.data);
