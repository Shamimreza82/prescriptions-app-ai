import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as mrApi from './api';

export const mrKeys = {
  myProfile: ['mr', 'my-profile'] as const,
  myDoctors: ['mr', 'my-doctors'] as const,
  dashboard: ['mr', 'dashboard'] as const,
  doctorPatients: (doctorId: string) => ['mr', 'doctor-patients', doctorId] as const,
  doctorPrescriptions: (doctorId: string) => ['mr', 'doctor-prescriptions', doctorId] as const,
  doctorPrescription: (doctorId: string, id: string) => ['mr', 'doctor-prescriptions', doctorId, id] as const,
  mrs: ['mr', 'list'] as const,
  mr: (id: string) => ['mr', id] as const,
  availableDoctors: ['mr', 'available-doctors'] as const,
  subscriptions: ['mr', 'subscriptions'] as const,
};

export const useMyProfile = () =>
  useQuery({
    queryKey: mrKeys.myProfile,
    queryFn: mrApi.getMyProfile,
  });

export const useUpdateMyProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mrApi.updateMyProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully');
      qc.invalidateQueries({ queryKey: mrKeys.myProfile });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile'),
  });
};

export const useMyDoctors = (params?: { page?: number; limit?: number; search?: string; sortPrescriptions?: string }) =>
  useQuery({
    queryKey: [...mrKeys.myDoctors, params],
    queryFn: () => mrApi.getMyDoctors(params),
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

export const useUpdateMr = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fullName?: string; phone?: string; company?: string; department?: string; designation?: string } }) =>
      mrApi.updateMr(id, data),
    onSuccess: () => {
      toast.success('MR updated successfully');
      qc.invalidateQueries({ queryKey: mrKeys.mrs });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update MR'),
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

export const useReportsOverview = () =>
  useQuery({
    queryKey: ['mr', 'reports', 'overview'],
    queryFn: mrApi.getReportsOverview,
  });

export const useReportsPrescriptions = (params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string; status?: string }) =>
  useQuery({
    queryKey: ['mr', 'reports', 'prescriptions', params],
    queryFn: () => mrApi.getReportsPrescriptions(params),
  });

export const useReportsMedicines = (params?: { page?: number; limit?: number; doctorId?: string }) =>
  useQuery({
    queryKey: ['mr', 'reports', 'medicines', params],
    queryFn: () => mrApi.getReportsMedicines(params),
  });

export const useReportsRevenue = (params?: { page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['mr', 'reports', 'revenue', params],
    queryFn: () => mrApi.getReportsRevenue(params),
  });

export const useMrSubscriptions = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: [...mrKeys.subscriptions, params],
    queryFn: () => mrApi.getMrSubscriptions(params),
  });

// ── Audit Hooks ────────────────────────────────────────────────────

export const useAuditOverview = () =>
  useQuery({
    queryKey: ['mr', 'audit', 'overview'],
    queryFn: mrApi.getAuditOverview,
  });

export const useAuditDoctors = (params?: { page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['mr', 'audit', 'doctors', params],
    queryFn: () => mrApi.getAuditDoctors(params),
  });

export const useAuditMedicines = (params?: { page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['mr', 'audit', 'medicines', params],
    queryFn: () => mrApi.getAuditMedicines(params),
  });

export const useAuditTrends = (params?: { doctorId?: string; medicineName?: string }) =>
  useQuery({
    queryKey: ['mr', 'audit', 'trends', params],
    queryFn: () => mrApi.getAuditTrends(params),
  });

export const useTrackedMedicines = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: ['mr', 'audit', 'tracked-medicines', params],
    queryFn: () => mrApi.listTrackedMedicines(params),
  });

export const useAddTrackedMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mrApi.addTrackedMedicine,
    onSuccess: () => {
      toast.success('Medicine added to tracking');
      qc.invalidateQueries({ queryKey: ['mr', 'audit', 'tracked-medicines'] });
      qc.invalidateQueries({ queryKey: ['mr', 'audit', 'overview'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add medicine'),
  });
};

export const useToggleTrackedMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mrApi.toggleTrackedMedicine,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mr', 'audit', 'tracked-medicines'] });
      qc.invalidateQueries({ queryKey: ['mr', 'audit', 'overview'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update medicine'),
  });
};

export const useRemoveTrackedMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mrApi.removeTrackedMedicine,
    onSuccess: () => {
      toast.success('Medicine removed from tracking');
      qc.invalidateQueries({ queryKey: ['mr', 'audit', 'tracked-medicines'] });
      qc.invalidateQueries({ queryKey: ['mr', 'audit', 'overview'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove medicine'),
  });
};

export const useSubscribeDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, data }: { doctorId: string; data: { planId: string; transactionId?: string; notes?: string } }) =>
      mrApi.subscribeDoctor(doctorId, data),
    onSuccess: () => {
      toast.success('Subscription initiated successfully');
      qc.invalidateQueries({ queryKey: mrKeys.subscriptions });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to subscribe doctor'),
  });
};
