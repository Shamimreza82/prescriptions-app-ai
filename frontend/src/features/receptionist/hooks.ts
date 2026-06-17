'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as receptionistApi from './api';

export const recKeys = {
  dashboard: ['receptionist', 'dashboard'] as const,
  patients: {
    all: ['receptionist', 'patients'] as const,
    list: (params?: Record<string, string>) => ['receptionist', 'patients', 'list', params] as const,
    detail: (id: string) => ['receptionist', 'patients', id] as const,
  },
  appointments: {
    all: ['receptionist', 'appointments'] as const,
    list: (params?: Record<string, string>) => ['receptionist', 'appointments', 'list', params] as const,
  },
  prescriptions: {
    all: ['receptionist', 'prescriptions'] as const,
    list: (params?: Record<string, string>) => ['receptionist', 'prescriptions', 'list', params] as const,
    detail: (id: string) => ['receptionist', 'prescriptions', id] as const,
  },
};

export const useRecDashboard = () =>
  useQuery({
    queryKey: recKeys.dashboard,
    queryFn: receptionistApi.getDashboard,
  });

export const useRecPatients = (params?: Record<string, string>) =>
  useQuery({
    queryKey: recKeys.patients.list(params),
    queryFn: () => receptionistApi.getPatients(params),
  });

export const useRecPatient = (id: string) =>
  useQuery({
    queryKey: recKeys.patients.detail(id),
    queryFn: () => receptionistApi.getPatient(id),
    enabled: !!id,
  });

export const useCreateRecPatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: receptionistApi.createPatient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recKeys.patients.all });
      toast.success('Patient created successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create patient'),
  });
};

export const useUpdateRecPatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => receptionistApi.updatePatient(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: recKeys.patients.all });
      qc.invalidateQueries({ queryKey: recKeys.patients.detail(vars.id) });
      toast.success('Patient updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  });
};

export const useRecAppointments = (params?: Record<string, string>) =>
  useQuery({
    queryKey: recKeys.appointments.list(params),
    queryFn: () => receptionistApi.getAppointments(params),
  });

export const useCreateRecAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: receptionistApi.createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recKeys.appointments.all });
      toast.success('Appointment scheduled');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create appointment'),
  });
};

export const useUpdateRecAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => receptionistApi.updateAppointment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recKeys.appointments.all });
      toast.success('Appointment updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update appointment'),
  });
};

export const useRecPrescriptions = (params?: Record<string, string>) =>
  useQuery({
    queryKey: recKeys.prescriptions.list(params),
    queryFn: () => receptionistApi.getPrescriptions(params),
  });

export const useRecPrescription = (id: string) =>
  useQuery({
    queryKey: recKeys.prescriptions.detail(id),
    queryFn: () => receptionistApi.getPrescription(id),
    enabled: !!id,
  });

// Doctor-specific hooks for managing own receptionists
export const doctorRecKeys = {
  all: ['doctor', 'receptionists'] as const,
  list: (params?: Record<string, unknown>) => ['doctor', 'receptionists', 'list', params] as const,
};

export const useMyReceptionists = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: doctorRecKeys.list(params as Record<string, unknown>),
    queryFn: () => receptionistApi.getMyReceptionists(params),
  });

export const useCreateReceptionistByDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: receptionistApi.createReceptionistByDoctor,
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('Receptionist created successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create receptionist'),
  });
};

export const useDeleteReceptionistByDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: receptionistApi.deleteReceptionistByDoctor,
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('Receptionist deleted successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete receptionist'),
  });
};
