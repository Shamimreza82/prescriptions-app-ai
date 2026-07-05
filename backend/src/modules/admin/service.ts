import { hashPassword } from '../../utils/password';
import { notFound, badRequest } from '../../utils/errors';
import { getPaginationParams } from '../../utils/pagination';
import * as repo from './repository';
import * as subService from '../subscription/service';
import { Request } from 'express';

export const getDashboardStats = () => repo.getAdminStats();

export const listDoctors = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  const filters = {
    status: query.status as string | undefined,
    specialization: query.specialization as string | undefined,
  };
  return repo.findAllDoctors(pagination, filters);
};

export const approveDoctor = async (userId: string) => {
  const user = await repo.findUserById(userId);
  if (!user || user.role !== 'DOCTOR') throw notFound('Doctor not found');
  return repo.verifyUser(userId);
};

export const toggleDoctorVerification = async (userId: string) => {
  const user = await repo.findUserById(userId);
  if (!user || user.role !== 'DOCTOR') throw notFound('Doctor not found');
  const updated = await repo.updateUserVerification(userId, !user.isVerified);
  return { isVerified: updated.isVerified };
};

export const toggleDoctorStatus = async (userId: string) => {
  const user = await repo.findUserById(userId);
  if (!user || user.role !== 'DOCTOR') throw notFound('Doctor not found');
  return repo.updateUserStatus(userId, !user.isActive);
};

export const toggleUserStatus = async (userId: string) => {
  const user = await repo.findUserById(userId);
  if (!user) throw notFound('User not found');
  if (user.role === 'SUPER_ADMIN') throw badRequest('Cannot deactivate a super admin');
  return repo.updateUserStatus(userId, !user.isActive);
};

export const deleteDoctor = async (userId: string) => {
  const user = await repo.findUserById(userId);
  if (!user || user.role !== 'DOCTOR') throw notFound('Doctor not found');
  return repo.deleteUser(userId);
};

export const resetDoctorPassword = async (userId: string, newPassword: string) => {
  const user = await repo.findUserById(userId);
  if (!user || user.role !== 'DOCTOR') throw notFound('Doctor not found');
  const hashed = await hashPassword(newPassword);
  return repo.updateUserPassword(userId, hashed);
};

export const listSubscriptions = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.getAllSubscriptions(pagination);
};

export const updateSubscriptionPlan = async (id: string, data: { plan?: string; status?: string; patientLimit?: number; prescriptionLimit?: number }) => {
  if (data.plan) {
    return subService.adminSetPlan(id, data.plan);
  }
  if (data.patientLimit !== undefined || data.prescriptionLimit !== undefined) {
    return subService.adminUpdateLimits(id, data);
  }
  if (data.status) {
    return repo.updateSubscription(id, { status: data.status });
  }
  throw badRequest('No valid update data provided');
};

export const listPlans = () => repo.findAllPlans();

export const getPlan = async (id: string) => {
  const plan = await repo.findPlanById(id);
  if (!plan) throw notFound('Plan not found');
  return plan;
};

export const createPlan = async (data: { name: string; description?: string; price: number; patientLimit: number; prescriptionLimit: number }) =>
  repo.createPlan(data);

export const editPlan = async (id: string, data: { name?: string; description?: string; price?: number; patientLimit?: number; prescriptionLimit?: number; isActive?: boolean }) => {
  const plan = await repo.findPlanById(id);
  if (!plan) throw notFound('Plan not found');
  return repo.updatePlan(id, data);
};

export const removePlan = async (id: string) => {
  const plan = await repo.findPlanById(id);
  if (!plan) throw notFound('Plan not found');
  return repo.deletePlan(id);
};

export const getUser = async (userId: string) => {
  const user = await repo.findUserById(userId);
  if (!user) throw notFound('User not found');
  return user;
};

export const clearDoctorMrAssignments = async (doctorId: string) => {
  await repo.clearDoctorMrAssignments(doctorId);
  return { message: 'All MR assignments cleared for doctor' };
};

export const resetUserPassword = async (userId: string, newPassword: string) => {
  const user = await repo.findUserById(userId);
  if (!user) throw notFound('User not found');
  if (user.role === 'SUPER_ADMIN') throw badRequest('Cannot reset password of a super admin');
  const hashed = await hashPassword(newPassword);
  return repo.updateUserPassword(userId, hashed);
};
