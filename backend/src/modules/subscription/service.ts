import { getPaginationParams } from '../../utils/pagination';
import { db } from '../../config/database';
import { Request } from 'express';
import { badRequest } from '../../utils/errors';
import * as repo from './repository';

export const getDoctorDashboardStats = async (doctorId: string) => {
  const [totalPatients, totalPrescriptions, monthlyAppointments, monthlyPrescriptions, todaysPrescriptions, monthlyData] =
    await repo.getDoctorStats(doctorId);
  return { totalPatients, totalPrescriptions, monthlyAppointments, monthlyPrescriptions, todaysPrescriptions, monthlyData };
};

export const getAdminDashboardStats = async () => {
  const [totalDoctors, activeDoctors, totalPatients, totalPrescriptions, revenue, planDist, statusDist, pendingCount] =
    await repo.getAdminStats();

  const planIds = planDist.map((p: { planId: string }) => p.planId);
  const plans = await db.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, name: true } });
  const planMap = new Map(plans.map((p: { id: string; name: string }) => [p.id, p.name]));

  const planDistribution = planDist.map((p: { planId: string; _count: number }) => ({
    plan: planMap.get(p.planId) || p.planId,
    planId: p.planId,
    _count: p._count,
  }));

  return {
    totalDoctors,
    activeDoctors,
    totalPatients,
    totalPrescriptions,
    totalRevenue: revenue._sum.amount || 0,
    pendingSubscriptions: pendingCount,
    planDistribution,
    subscriptionStatusDistribution: statusDist,
  };
};

export const getDoctorSubscription = (doctorId: string) =>
  repo.getSubscriptionByDoctor(doctorId);

export const getActivityLogs = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.getAuditLogs(pagination);
};

export const deleteActivityLogs = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) throw badRequest('startDate and endDate are required');
  if (new Date(endDate) < new Date(startDate)) throw badRequest('endDate must be after startDate');
  return repo.deleteAuditLogs(startDate, endDate);
};

export const deleteActivityLog = (id: string) =>
  repo.deleteAuditLogById(id);

export const deleteActivityLogsBulk = (ids: string[]) => {
  if (!ids.length) throw badRequest('No log IDs provided');
  return repo.deleteAuditLogsByIds(ids);
};

export const getAdminDoctors = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  const filters = {
    verified: query.verified as string | undefined,
    status: query.status as string | undefined,
  };
  return repo.getAllDoctorsForAdmin(pagination, filters);
};

export const getAdminUsers = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  const filters = {
    status: query.status as string | undefined,
    verified: query.verified as string | undefined,
    role: query.role as string | undefined,
  };
  return repo.getAllUsers(pagination, filters);
};

export const getAdminSubscriptions = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.getAllSubscriptions(pagination);
};

export const getAdminPatients = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.getAllPatientsForAdmin(pagination);
};

export const activateSubscription = async (doctorId: string, planId: string) => {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) throw badRequest('Plan not found');
  if (!plan.isActive) throw badRequest('Plan is not available');

  const endDate = plan.duration ? new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000) : null;

  return repo.activatePlan(doctorId, planId, plan.patientLimit, plan.prescriptionLimit, endDate);
};
