'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as rxApi from './api';

export const rxKeys = {
  all: ['prescriptions'] as const,
  list: (params?: Record<string, string>) => ['prescriptions', 'list', params] as const,
  detail: (id: string) => ['prescriptions', id] as const,
};

export const usePrescriptions = (params?: Record<string, string>) =>
  useQuery({
    queryKey: rxKeys.list(params),
    queryFn: () => rxApi.getPrescriptions(params),
  });

export const usePrescription = (id: string) =>
  useQuery({
    queryKey: rxKeys.detail(id),
    queryFn: () => rxApi.getPrescription(id),
    enabled: !!id,
  });

export const useCreatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rxApi.createPrescription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rxKeys.all });
      toast.success('Prescription created successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create prescription'),
  });
};

export const useUpdatePrescription = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => rxApi.updatePrescription(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rxKeys.all });
      qc.invalidateQueries({ queryKey: rxKeys.detail(id) });
      toast.success('Prescription updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update prescription'),
  });
};

export const useDeletePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rxApi.deletePrescription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rxKeys.all });
      toast.success('Prescription deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed'),
  });
};
