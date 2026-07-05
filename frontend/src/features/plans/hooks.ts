import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as plansApi from './api';

export const planKeys = {
  list: ['plans'] as const,
  detail: (id: string) => ['plans', id] as const,
};

export const usePlans = () =>
  useQuery({
    queryKey: planKeys.list,
    queryFn: plansApi.getPlans,
  });

export const useCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plansApi.createPlan,
    onSuccess: () => {
      toast.success('Plan created');
      qc.invalidateQueries({ queryKey: planKeys.list });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create plan'),
  });
};

export const useUpdatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('./types').UpdatePlanInput }) =>
      plansApi.updatePlan(id, data),
    onSuccess: () => {
      toast.success('Plan updated');
      qc.invalidateQueries({ queryKey: planKeys.list });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update plan'),
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plansApi.deletePlan,
    onSuccess: () => {
      toast.success('Plan deleted');
      qc.invalidateQueries({ queryKey: planKeys.list });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete plan'),
  });
};

export const useMySubscription = () =>
  useQuery({
    queryKey: ['my-subscription'],
    queryFn: plansApi.getMySubscription,
  });

export const useActivatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, transactionId, notes }: { planId: string; transactionId?: string; notes?: string }) =>
      plansApi.activatePlan(planId, transactionId, notes),
    onSuccess: () => {
      toast.success('Plan activated');
      qc.invalidateQueries({ queryKey: ['dashboard', 'doctor'] });
      qc.invalidateQueries({ queryKey: ['my-subscription'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to activate plan'),
  });
};

export const usePendingSubscriptions = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: ['pending-subscriptions', params],
    queryFn: () => plansApi.getPendingSubscriptions(params),
  });

export const useConfirmSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plansApi.confirmSubscription,
    onSuccess: () => {
      toast.success('Subscription confirmed');
      qc.invalidateQueries({ queryKey: ['pending-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin', 'subscriptions'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to confirm subscription'),
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plansApi.cancelSubscription,
    onSuccess: () => {
      toast.success('Subscription cancelled');
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin', 'subscriptions'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel subscription'),
  });
};

export const useRejectSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plansApi.rejectSubscription,
    onSuccess: () => {
      toast.success('Subscription rejected');
      qc.invalidateQueries({ queryKey: ['pending-subscriptions'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reject subscription'),
  });
};

export const useUpdateAdminSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { plan?: string; patientLimit?: number; prescriptionLimit?: number; status?: string } }) =>
      plansApi.updateAdminSubscription(id, data),
    onSuccess: () => {
      toast.success('Subscription updated');
      qc.invalidateQueries({ queryKey: ['dashboard', 'admin', 'subscriptions'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update subscription'),
  });
};
