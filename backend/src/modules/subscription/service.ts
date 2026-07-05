import { getPaginationParams } from '../../utils/pagination';
import { db } from '../../config/database';
import { Request } from 'express';
import { badRequest, notFound } from '../../utils/errors';
import * as repo from './repository';

export const getDoctorDashboardStats = async (doctorId: string) => {
  const [totalPatients, totalPrescriptions, monthlyAppointments, monthlyPrescriptions, todaysPrescriptions, monthlyData] =
    await repo.getDoctorStats(doctorId);
  return { totalPatients, totalPrescriptions, monthlyAppointments, monthlyPrescriptions, todaysPrescriptions, monthlyData };
};

export const getAdminDashboardStats = async () => {
  const [totalDoctors, activeDoctors, totalPatients, totalPrescriptions, revenue, planDist, statusDist, pendingCount, pendingVerificationCount] =
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
    pendingVerification: pendingVerificationCount,
    planDistribution,
    subscriptionStatusDistribution: statusDist,
  };
};

// ========== Public Queries ==========

export const getDoctorSubscription = (doctorId: string) =>
  repo.getSubscriptionByDoctor(doctorId);

export const getById = (id: string) =>
  db.subscription.findUnique({
    where: { id },
    include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });

// ========== Internal Helpers ==========

const getPlanOrThrow = async (planId: string) => {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) throw badRequest('Plan not found');
  if (!plan.isActive) throw badRequest('Plan is not available');
  return plan;
};

const downgradeToFreePlan = async (subscriptionId: string) => {
  const freePlan = await db.plan.findFirst({ where: { price: 0, isActive: true } });
  if (!freePlan) throw notFound('Free plan not found');
  return db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      planId: freePlan.id,
      patientLimit: freePlan.patientLimit,
      prescriptionLimit: freePlan.prescriptionLimit,
    },
    include: { plan: true, doctor: { select: { id: true, fullName: true, clinicName: true } } },
  });
};

const calculateEndDate = (duration: number) =>
  duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

export const validateNoActiveOrPending = async (doctorId: string) => {
  const existingSub = await db.subscription.findUnique({ where: { doctorId } });
  if (!existingSub) return;
  if (existingSub.status === 'PENDING') {
    throw badRequest('You already have a pending subscription awaiting admin approval. Please wait before subscribing to a new plan.');
  }
  if (existingSub.status === 'ACTIVE') {
    if (!existingSub.endDate || existingSub.endDate > new Date()) {
      const expiryMsg = existingSub.endDate
        ? `expires on ${existingSub.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : 'has unlimited duration';
      throw badRequest(`Your current plan is still active and ${expiryMsg}. You can subscribe to a new plan after it expires.`);
    }
    await db.subscription.update({
      where: { id: existingSub.id },
      data: { status: 'EXPIRED' },
    });
  }
};

export const autoDowngradeExpiredIfNeeded = async (doctorId: string) => {
  const sub = await db.subscription.findUnique({ where: { doctorId }, include: { plan: true } });
  if (sub && sub.status === 'ACTIVE' && sub.endDate && sub.endDate < new Date()) {
    const freePlan = await db.plan.findFirst({ where: { price: 0, isActive: true } });
    if (!freePlan) throw notFound('Free plan not found');
    await db.subscription.update({
      where: { doctorId },
      data: {
        planId: freePlan.id,
        status: 'ACTIVE',
        patientLimit: freePlan.patientLimit,
        prescriptionLimit: freePlan.prescriptionLimit,
      },
    });
    return db.subscription.findUnique({ where: { doctorId }, include: { plan: true } });
  }
  return sub;
};

// ========== Central Activation (unified for all activation flows) ==========

export const activateDoctorPlan = async (doctorId: string, planId: string, transactionId?: string, notes?: string) => {
  const plan = await getPlanOrThrow(planId);
  await validateNoActiveOrPending(doctorId);

  const endDate = calculateEndDate(plan.duration);
  const isPaid = plan.price > 0;
  const status = isPaid ? 'PENDING' : 'ACTIVE';

  const sub = await db.subscription.upsert({
    where: { doctorId },
    update: { planId, status, patientLimit: plan.patientLimit, prescriptionLimit: plan.prescriptionLimit, startDate: new Date(), endDate },
    create: { doctorId, planId, status, patientLimit: plan.patientLimit, prescriptionLimit: plan.prescriptionLimit, startDate: new Date(), endDate },
    include: { plan: true },
  });

  if (isPaid && transactionId) {
    await db.payment.create({
      data: {
        subscriptionId: sub.id,
        amount: plan.price,
        currency: 'BDT',
        status: 'PENDING',
        paymentMethod: 'MANUAL',
        transactionId,
        notes,
      },
    });
  }

  return sub;
};

// Route B backward compatibility — delegates to central function
export const activateSubscription = (doctorId: string, planId: string) =>
  activateDoctorPlan(doctorId, planId);

// ========== Admin: Plan/Limit Management ==========

export const adminSetPlan = async (subscriptionId: string, planId: string) => {
  const plan = await getPlanOrThrow(planId);
  const endDate = calculateEndDate(plan.duration);
  const sub = await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      planId: plan.id,
      status: 'ACTIVE',
      patientLimit: plan.patientLimit,
      prescriptionLimit: plan.prescriptionLimit,
      startDate: new Date(),
      endDate,
    },
    include: { plan: true, doctor: { select: { id: true, fullName: true, clinicName: true } } },
  });
  if (!sub) throw notFound('Subscription not found');
  return sub;
};

export const adminUpdateLimits = async (subscriptionId: string, data: { patientLimit?: number; prescriptionLimit?: number }) => {
  const updateData: Record<string, any> = {};
  if (data.patientLimit !== undefined) updateData.patientLimit = data.patientLimit;
  if (data.prescriptionLimit !== undefined) updateData.prescriptionLimit = data.prescriptionLimit;
  const sub = await db.subscription.update({ where: { id: subscriptionId }, data: updateData });
  if (!sub) throw notFound('Subscription not found');
  return sub;
};

// ========== Admin: Status Management ==========

export const confirmPayment = async (subscriptionId: string) => {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId }, include: { payments: true } });
  if (!sub) throw notFound('Subscription not found');
  if (sub.status !== 'PENDING') throw badRequest('Subscription is not pending');

  await db.payment.updateMany({
    where: { subscriptionId, status: 'PENDING' },
    data: { status: 'COMPLETED' },
  });

  return db.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'ACTIVE' },
    include: { plan: true, doctor: { select: { id: true, fullName: true, clinicName: true } } },
  });
};

export const rejectPayment = async (subscriptionId: string) => {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw notFound('Subscription not found');
  if (sub.status !== 'PENDING') throw badRequest('Subscription is not pending');

  await db.payment.updateMany({
    where: { subscriptionId, status: 'PENDING' },
    data: { status: 'REJECTED' },
  });

  return downgradeToFreePlan(subscriptionId);
};

export const cancelByAdmin = async (subscriptionId: string) => {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw notFound('Subscription not found');
  if (sub.status === 'CANCELLED') throw badRequest('Subscription is already cancelled');

  return downgradeToFreePlan(subscriptionId);
};

export const getPendingList = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  const where: any = { status: 'PENDING' };
  if (pagination.search) {
    where.OR = [
      { doctor: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
      { doctor: { clinicName: { contains: pagination.search, mode: 'insensitive' } } },
      { doctor: { bmdcRegNo: { contains: pagination.search, mode: 'insensitive' } } },
      { payments: { some: { transactionId: { contains: pagination.search, mode: 'insensitive' } } } },
    ];
  }
  return Promise.all([
    db.subscription.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        doctor: { select: { id: true, fullName: true, clinicName: true, phone: true } },
        plan: true,
        payments: { where: { status: 'PENDING' }, select: { id: true, transactionId: true, amount: true, currency: true, notes: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.subscription.count({ where }),
  ] as const);
};

// ========== Audit Logs & Admin Lists (unchanged) ==========

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
