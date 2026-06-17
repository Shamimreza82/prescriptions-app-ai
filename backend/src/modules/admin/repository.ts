import { db } from '../../config/database';
import { PaginationParams } from '../../utils/pagination';

const getMonthlyCounts = async (model: 'doctor' | 'patient' | 'prescription') => {
  const now = new Date();
  const results = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const ms = new Date(now.getFullYear(), i, 1);
      const me = new Date(now.getFullYear(), i + 1, 1);
      if (model === 'doctor') return db.doctor.count({ where: { createdAt: { gte: ms, lt: me } } });
      if (model === 'patient') return db.patient.count({ where: { createdAt: { gte: ms, lt: me } } });
      return db.prescription.count({ where: { createdAt: { gte: ms, lt: me } } });
    })
  );
  return results;
};

const getMonthlyRevenue = async () => {
  const now = new Date();
  const results = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const ms = new Date(now.getFullYear(), i, 1);
      const me = new Date(now.getFullYear(), i + 1, 1);
      return db.payment.aggregate({
        where: { createdAt: { gte: ms, lt: me } },
        _sum: { amount: true },
      });
    })
  );
  return results.map((r) => r._sum.amount || 0);
};

export const getAdminStats = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    totalDoctors,
    activeDoctors,
    pendingApprovals,
    totalPatients,
    totalPrescriptions,
    totalAppointments,
    activeSubscriptions,
    monthlyRevenue,
    annualRevenue,
    newDoctorsThisMonth,
    newPatientsThisMonth,
    prescriptionsThisMonth,
    planDistribution,
  ] = await Promise.all([
    db.doctor.count(),
    db.doctor.count({ where: { user: { isActive: true } } }),
    db.user.count({ where: { role: 'DOCTOR', isVerified: false } }),
    db.patient.count(),
    db.prescription.count(),
    db.appointment.count(),
    db.subscription.count({ where: { status: 'ACTIVE' } }),
    db.payment.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { createdAt: { gte: yearStart } }, _sum: { amount: true } }),
    db.doctor.count({ where: { createdAt: { gte: monthStart } } }),
    db.patient.count({ where: { createdAt: { gte: monthStart } } }),
    db.prescription.count({ where: { createdAt: { gte: monthStart } } }),
    db.subscription.groupBy({ by: ['planId'], _count: true }),
  ]);

  const planIds = planDistribution.map((item: { planId: string }) => item.planId);
  const plans = await db.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, name: true } });
  const planMap = new Map(plans.map((plan: { id: string; name: string }) => [plan.id, plan.name]));

  const normalizedPlanDistribution = planDistribution.map((item: { planId: string; _count: number }) => ({
    plan: planMap.get(item.planId) || item.planId,
    _count: item._count,
  }));

  const [monthlyRevenueData, monthlyDoctorsData, monthlyPrescriptionsData] = await Promise.all([
    getMonthlyRevenue(),
    getMonthlyCounts('doctor'),
    getMonthlyCounts('prescription'),
  ]);

  return {
    totalDoctors,
    activeDoctors,
    pendingApprovals,
    totalPatients,
    totalPrescriptions,
    totalAppointments,
    activeSubscriptions,
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
    annualRevenue: annualRevenue._sum.amount || 0,
    newDoctorsThisMonth,
    newPatientsThisMonth,
    prescriptionsThisMonth,
    planDistribution: normalizedPlanDistribution,
    monthlyRevenueData,
    monthlyDoctorsData,
    monthlyPrescriptionsData,
  };
};

export const findAllDoctors = (pagination: PaginationParams, filters: { status?: string; specialization?: string }) => {
  const where: any = {};
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { clinicName: { contains: pagination.search, mode: 'insensitive' } },
      { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }
  if (filters.status === 'active') where.user = { ...where.user, isActive: true };
  if (filters.status === 'suspended') where.user = { ...where.user, isActive: false };
  if (filters.specialization) where.specialization = { contains: filters.specialization, mode: 'insensitive' };

  return Promise.all([
    db.doctor.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        user: { select: { id: true, email: true, isActive: true, isVerified: true, createdAt: true } },
        subscription: true,
        _count: { select: { patients: true, prescriptions: true, appointments: true } },
        mrAssignments: {
          include: {
            mr: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.doctor.count({ where }),
  ] as const);
};

export const findUserById = (userId: string) =>
  db.user.findUnique({
    where: { id: userId },
    include: {
      doctor: {
        include: {
          subscription: { include: { plan: true, payments: true } },
          _count: { select: { patients: true, prescriptions: true, appointments: true } },
        },
      },
      receptionist: true,
      mr: true,
      _count: { select: { auditLogs: true, notifications: true } },
    },
  });

export const updateUserStatus = (userId: string, isActive: boolean) =>
  db.user.update({ where: { id: userId }, data: { isActive } });

export const verifyUser = (userId: string) =>
  db.user.update({ where: { id: userId }, data: { isVerified: true } });

export const deleteUser = (userId: string) =>
  db.user.delete({ where: { id: userId } });

export const updateUserPassword = (userId: string, hashed: string) =>
  db.user.update({ where: { id: userId }, data: { password: hashed } });

export const getAllSubscriptions = (pagination: PaginationParams) => {
  const where: any = {};
  if (pagination.search) {
    where.doctor = {
      OR: [
        { fullName: { contains: pagination.search, mode: 'insensitive' } },
        { clinicName: { contains: pagination.search, mode: 'insensitive' } },
      ],
    };
  }
  return Promise.all([
    db.subscription.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: { doctor: { select: { id: true, fullName: true, clinicName: true, user: { select: { email: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.subscription.count({ where }),
  ] as const);
};

export const updateSubscription = (id: string, data: { plan?: string; status?: string; patientLimit?: number; prescriptionLimit?: number }) =>
  db.subscription.update({ where: { id }, data: data as any });

export const findAllPlans = () =>
  db.plan.findMany({ orderBy: { price: 'asc' } });

export const findPlanById = (id: string) =>
  db.plan.findUnique({ where: { id } });

export const createPlan = (data: { name: string; description?: string; price: number; patientLimit: number; prescriptionLimit: number }) =>
  db.plan.create({ data });

export const updatePlan = (id: string, data: { name?: string; description?: string; price?: number; patientLimit?: number; prescriptionLimit?: number; isActive?: boolean }) =>
  db.plan.update({ where: { id }, data });

export const deletePlan = (id: string) =>
  db.plan.delete({ where: { id } });

export const clearDoctorMrAssignments = (doctorId: string) =>
  db.doctorMrAssignment.deleteMany({ where: { doctorId } });
