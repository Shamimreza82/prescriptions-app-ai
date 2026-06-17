import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as mrApi from './api';

export const mrKeys = {
  myDoctors: ['mr', 'my-doctors'] as const,
  dashboard: ['mr', 'dashboard'] as const,
  doctorPatients: (doctorId: string) => ['mr', 'doctor-patients', doctorId] as const,
  doctorPrescriptions: (doctorId: string) => ['mr', 'doctor-prescriptions', doctorId] as const,
  doctorPrescription: (doctorId: string, id: string) => ['mr', 'doctor-prescriptions', doctorId, id] as const,
  mrs: ['mr', 'list'] as const,
  mr: (id: string) => ['mr', id] as const,
  availableDoctors: ['mr', 'available-doctors'] as const,
};

export const useMyDoctors = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: [...mrKeys.myDoctors, params],
    queryFn: () => mrApi.getMyDoctors(params),
  });

export const useDoctorPatients = (doctorId: string) =>
  useQuery({
    queryKey: mrKeys.doctorPatients(doctorId),
    queryFn: () => mrApi.getDoctorPatients(doctorId),
    enabled: !!doctorId,
  });

export const useDoctorPrescriptions = (doctorId: string, params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }) =>
  useQuery({
    queryKey: [...mrKeys.doctorPrescriptions(doctorId), params],
    queryFn: () => mrApi.getDoctorPrescriptions(doctorId, params),
    enabled: !!doctorId,
  });

export const useMrs = (params?: { page?: number; limit?: number; search?: string; status?: string; verified?: string; role?: string }) =>
  useQuery({
    queryKey: [...mrKeys.mrs, params],
    queryFn: () => mrApi.getMrs(params),
  });

export const useMrById = (id: string) =>
  useQuery({
    queryKey: mrKeys.mr(id),
    queryFn: () => mrApi.getMrById(id),
    enabled: !!id,
  });

export const useDashboardStats = () =>
  useQuery({
    queryKey: mrKeys.dashboard,
    queryFn: mrApi.getDashboardStats,
  });

export const useDoctorPrescriptionById = (doctorId: string, prescriptionId: string) =>
  useQuery({
    queryKey: mrKeys.doctorPrescription(doctorId, prescriptionId),
    queryFn: () => mrApi.getDoctorPrescriptionById(doctorId, prescriptionId),
    enabled: !!doctorId && !!prescriptionId,
  });

export const useAvailableDoctors = () =>
  useQuery({
    queryKey: mrKeys.availableDoctors,
    queryFn: mrApi.getAvailableDoctors,
  });

export const useCreateMr = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mrApi.createMr,
    onSuccess: () => {
      toast.success('Medical Representative created successfully');
      qc.invalidateQueries({ queryKey: mrKeys.mrs, refetchType: 'all' });
      qc.invalidateQueries({ queryKey: mrKeys.availableDoctors });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create MR'),
  });
};

export const useDeleteMr = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mrApi.deleteMr,
    onSuccess: () => {
      toast.success('MR deleted successfully');
      qc.invalidateQueries({ queryKey: mrKeys.mrs });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete MR'),
  });
};

export const useAssignDoctors = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mrId, data }: { mrId: string; data: { doctorIds: string[] } }) =>
      mrApi.assignDoctors(mrId, data),
    onSuccess: () => {
      toast.success('Doctors assigned successfully');
      qc.invalidateQueries({ queryKey: mrKeys.mrs });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to assign doctors'),
  });
};
