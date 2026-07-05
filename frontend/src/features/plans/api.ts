import { api } from '@/lib/axios';
import type { Plan, CreatePlanInput, UpdatePlanInput } from './types';

export const getPlans = () =>
  api.get<{ success: boolean; data: Plan[] }>('/plans').then((r) => r.data.data);

export const createPlan = (data: CreatePlanInput) =>
  api.post<{ success: boolean; data: Plan }>('/plans', data).then((r) => r.data.data);

export const updatePlan = (id: string, data: UpdatePlanInput) =>
  api.put<{ success: boolean; data: Plan }>(`/plans/${id}`, data).then((r) => r.data.data);

export const deletePlan = (id: string) =>
  api.delete(`/plans/${id}`);

export const activatePlan = (planId: string, transactionId?: string, notes?: string) =>
  api.post<{ success: boolean; data: any }>('/doctors/subscription/activate', { planId, transactionId, notes }).then((r) => r.data.data);

export const getPendingSubscriptions = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/doctors/subscription/pending', { params }).then((r) => r.data);

export const confirmSubscription = (subscriptionId: string) =>
  api.post(`/doctors/subscription/${subscriptionId}/confirm`).then((r) => r.data.data);

export const rejectSubscription = (subscriptionId: string) =>
  api.post(`/doctors/subscription/${subscriptionId}/reject`).then((r) => r.data.data);

export const cancelSubscription = (subscriptionId: string) =>
  api.post(`/doctors/subscription/${subscriptionId}/cancel`).then((r) => r.data.data);

export const getMySubscription = () =>
  api.get<{ success: boolean; data: any }>('/doctors/subscription').then((r) => r.data.data);

export const updateAdminSubscription = (id: string, data: { plan?: string; patientLimit?: number; prescriptionLimit?: number; status?: string }) =>
  api.patch(`/admin/subscriptions/${id}`, data).then((r) => r.data);
