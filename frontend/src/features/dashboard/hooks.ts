import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as dashboardApi from './api';

export const dashboardKeys = {
  doctor: ['dashboard', 'doctor'] as const,
  admin: ['dashboard', 'admin'] as const,
  adminDoctors: ['dashboard', 'admin', 'doctors'] as const,
  adminUsers: ['dashboard', 'admin', 'users'] as const,
  adminUser: (id: string) => ['dashboard', 'admin', 'users', id] as const,
  adminSubscriptions: ['dashboard', 'admin', 'subscriptions'] as const,
};

export const useDoctorDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.doctor,
    queryFn: dashboardApi.getDoctorDashboard,
  });

export const useAdminDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.admin,
    queryFn: dashboardApi.getAdminDashboard,
  });

export const useAdminDoctors = (params?: { page?: number; limit?: number; search?: string; verified?: string; status?: string }) =>
  useQuery({
    queryKey: [...dashboardKeys.adminDoctors, params],
    queryFn: () => dashboardApi.getAdminDoctors(params),
  });

export const useAdminUsers = (params?: { page?: number; limit?: number; search?: string; status?: string; verified?: string; role?: string }) =>
  useQuery({
    queryKey: [...dashboardKeys.adminUsers, params],
    queryFn: () => dashboardApi.getAdminUsers(params),
  });

export const useAdminSubscriptions = (params?: { page?: number; limit?: number; search?: string; status?: string; planId?: string }) =>
  useQuery({
    queryKey: [...dashboardKeys.adminSubscriptions, params],
    queryFn: () => dashboardApi.getAdminSubscriptions(params),
  });

export const useAdminPatients = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: [...dashboardKeys.admin, 'patients', params],
    queryFn: () => dashboardApi.getAdminPatients(params),
  });

export const useAdminLogs = (params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }) =>
  useQuery({
    queryKey: [...dashboardKeys.admin, 'logs', params],
    queryFn: () => dashboardApi.getAdminLogs(params),
  });

export const useDeleteAdminLogs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      dashboardApi.deleteAdminLogs(startDate, endDate),
    onSuccess: (data) => {
      toast.success(`${data.data.deleted} log(s) deleted successfully`);
      queryClient.invalidateQueries({ queryKey: [...dashboardKeys.admin, 'logs'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete logs');
    },
  });
};

export const useDeleteAdminLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dashboardApi.deleteAdminLog(id),
    onSuccess: () => {
      toast.success('Log deleted');
      queryClient.invalidateQueries({ queryKey: [...dashboardKeys.admin, 'logs'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete log');
    },
  });
};

export const useDeleteAdminLogsBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => dashboardApi.deleteAdminLogsBulk(ids),
    onSuccess: (data) => {
      toast.success(`${data.data.deleted} log(s) deleted`);
      queryClient.invalidateQueries({ queryKey: [...dashboardKeys.admin, 'logs'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete logs');
    },
  });
};

export const useAdminUser = (userId: string) =>
  useQuery({
    queryKey: dashboardKeys.adminUser(userId),
    queryFn: () => dashboardApi.getAdminUser(userId),
    enabled: !!userId,
  });

export const useApproveDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.approveDoctor,
    onSuccess: (data) => {
      toast.success(data.message || 'Doctor approved successfully');
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminDoctors });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve doctor');
    },
  });
};

export const useToggleDoctorVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.toggleDoctorVerification,
    onSuccess: (data) => {
      toast.success(data.message || 'Doctor verification updated');
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminDoctors });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update verification');
    },
  });
};

export const useClearDoctorMrAssignments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.clearDoctorMrAssignments,
    onSuccess: (data) => {
      toast.success(data.message || 'MR assignments cleared');
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminDoctors });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to clear MR assignments');
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.toggleUserStatus,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminUsers });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    },
  });
};

export const useResetUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      dashboardApi.resetUserPassword(userId, newPassword),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successfully');
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminUsers });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    },
  });
};
