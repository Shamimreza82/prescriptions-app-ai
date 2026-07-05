import { db } from '../../config/database';
import { PaginationParams, PaginationParamsExtended } from '../../utils/pagination';
import type { Prisma } from '@prisma/client';

export const findMrByUserId = (userId: string) =>
  db.mr.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, isActive: true } },
      doctors: {
        include: {
          doctor: {
            include: {
              user: { select: { email: true } },
              subscription: {
                include: { plan: { select: { id: true, name: true, duration: true } } },
              },
              _count: { select: { patients: true, prescriptions: true } },
            },
          },
        },
      },
    },
  });

export const findMrById = (id: string) =>
  db.mr.findUnique({
    where: { id },
    include: {
      doctors: {
        include: {
          doctor: {
            include: {
              user: { select: { email: true, isActive: true } },
              _count: { select: { patients: true, prescriptions: true } },
            },
          },
        },
      },
    },
  });

export const findMrByEmail = (email: string) =>
  db.user.findUnique({
    where: { email },
    include: { mr: true },
  });

export const findAllMrs = (pagination: PaginationParams, filters: { status?: string; verified?: string; role?: string } = {}) => {
  const where: any = {};
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { phone: { contains: pagination.search, mode: 'insensitive' } },
      { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }
  if (filters.status === 'active') where.user = { ...where.user, isActive: true };
  if (filters.status === 'suspended') where.user = { ...where.user, isActive: false };
  if (filters.verified === 'verified') where.user = { ...where.user, isVerified: true };
  if (filters.verified === 'unverified') where.user = { ...where.user, isVerified: false };
  if (filters.role) where.user = { ...where.user, role: filters.role };
  return Promise.all([
    db.mr.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        user: { select: { id: true, email: true, isActive: true, isVerified: true, role: true, createdAt: true } },
        _count: { select: { doctors: true } },
        doctors: {
          include: {
            doctor: { select: { id: true, fullName: true, clinicName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.mr.count({ where }),
  ] as const);
};

export const createMr = (data: {
  userId: string;
  fullName: string;
  phone: string;
  company: string;
  department?: string;
  designation?: string;
}) =>
  db.mr.create({ data });

export const updateMr = (id: string, data: { fullName?: string; phone?: string; company?: string; department?: string; designation?: string }) =>
  db.mr.update({ where: { id }, data });

export const deleteMr = (id: string) =>
  db.mr.delete({ where: { id } });

export const assignDoctors = (mrId: string, doctorIds: string[]) =>
  db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.doctorMrAssignment.deleteMany({ where: { mrId } });
    if (doctorIds.length > 0) {
      await tx.doctorMrAssignment.createMany({
        data: doctorIds.map((doctorId) => ({ mrId, doctorId })),
      });
    }
  });

export const getDoctorPatients = (doctorId: string) =>
  db.patient.findMany({
    where: { doctorId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { prescriptions: true } } },
  });

export const getDoctorPrescriptions = (doctorId: string, pagination: PaginationParamsExtended) => {
  const where: any = { doctorId };
  if (pagination.search) {
    where.OR = [
      { prescriptionNo: { contains: pagination.search, mode: 'insensitive' } },
      { patient: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }
  if (pagination.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(pagination.dateFrom) };
  }
  if (pagination.dateTo) {
    const end = new Date(pagination.dateTo);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: end };
  }
  return Promise.all([
    db.prescription.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        patient: { select: { id: true, fullName: true, patientId: true, age: true, gender: true } },
        medicines: true,
        investigations: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.prescription.count({ where }),
  ] as const);
};

export const findDoctorsForAssignment = () =>
  db.doctor.findMany({
    where: { isProfileComplete: true, user: { isActive: true } },
    select: { id: true, fullName: true, clinicName: true, bmdcRegNo: true, userId: true, user: { select: { email: true, isVerified: true } } },
    orderBy: { fullName: 'asc' },
  });

export const getMyDoctorsPaginated = (mrId: string, pagination: PaginationParams, sortPrescriptions?: 'asc' | 'desc') => {
  const where: any = {
    mrAssignments: { some: { mrId } },
  };
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { specialization: { has: pagination.search } },
      { clinicName: { contains: pagination.search, mode: 'insensitive' } },
    ];
  }
  return Promise.all([
    db.doctor.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        user: { select: { email: true } },
        _count: { select: { patients: true, prescriptions: true } },
      },
      orderBy: { fullName: 'asc' },
    }).then(doctors => {
      if (sortPrescriptions) {
        doctors.sort((a, b) =>
          sortPrescriptions === 'desc'
            ? (b._count?.prescriptions || 0) - (a._count?.prescriptions || 0)
            : (a._count?.prescriptions || 0) - (b._count?.prescriptions || 0)
        );
      }
      return doctors;
    }),
    db.doctor.count({ where }),
  ] as const);
};

export const getTodaysPrescriptionsByDoctors = (doctorIds: string[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return db.prescription.count({
    where: {
      doctorId: { in: doctorIds },
      createdAt: { gte: today, lt: tomorrow },
    },
  });
};

export const getMrDoctorsPaginatedWithSubs = (mrId: string, pagination: PaginationParams) => {
  const where: any = {
    mrAssignments: { some: { mrId } },
  };
  if (pagination.search) {
    where.OR = [
      { prescriptionNo: { contains: pagination.search, mode: 'insensitive' } },
      { patient: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
      { doctor: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
      { medicines: { some: { name: { contains: pagination.search, mode: 'insensitive' } } } },
    ];
  }
  return Promise.all([
    db.doctor.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        user: { select: { email: true, isActive: true } },
        _count: { select: { patients: true, prescriptions: true } },
      },
      orderBy: { fullName: 'asc' },
    }),
    db.doctor.count({ where }),
  ] as const);
};

export const getTotalPrescriptionsByDoctors = (doctorIds: string[]) =>
  db.prescription.count({ where: { doctorId: { in: doctorIds } } });

export const getMonthlyPrescriptionTrends = (doctorIds: string[]) => {
  const now = new Date();
  return Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const ms = new Date(now.getFullYear(), i, 1);
      const me = new Date(now.getFullYear(), i + 1, 1);
      return db.prescription.count({
        where: { doctorId: { in: doctorIds }, createdAt: { gte: ms, lt: me } },
      });
    })
  );
};

export const getTodaysPrescriptionCount = (doctorIds: string[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return db.prescription.count({
    where: { doctorId: { in: doctorIds }, createdAt: { gte: today, lt: tomorrow } },
  });
};

export const getThisMonthPrescriptionCount = (doctorIds: string[]) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return db.prescription.count({
    where: { doctorId: { in: doctorIds }, createdAt: { gte: monthStart } },
  });
};

export const getWeeklyPrescriptionCounts = (doctorIds: string[]) => {
  const now = new Date();
  return Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return db.prescription.count({
        where: { doctorId: { in: doctorIds }, createdAt: { gte: day, lt: nextDay } },
      });
    })
  ).then((counts) => counts.reverse());
};

export const getTopMedicines = (doctorIds: string[], skip: number, take: number) => {
  const where = { prescription: { doctorId: { in: doctorIds } } };
  return Promise.all([
    db.medicine.groupBy({
      by: ['name', 'strength', 'form', 'genericName'],
      where,
      _count: { _all: true },
      orderBy: { _count: { name: 'desc' } },
      skip,
      take,
    }),
    db.medicine.groupBy({
      by: ['name', 'strength', 'form', 'genericName'],
      where,
    }).then(r => r.length),
  ] as const);
};

export const getFilteredPrescriptionsForMr = (
  doctorIds: string[],
  pagination: PaginationParamsExtended
) => {
  const where: any = { doctorId: { in: doctorIds } };
  if (pagination.search) {
    where.OR = [
      { prescriptionNo: { contains: pagination.search, mode: 'insensitive' } },
      { patient: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
      { doctor: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
      { medicines: { some: { name: { contains: pagination.search, mode: 'insensitive' } } } },
    ];
  }
  if (pagination.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(pagination.dateFrom) };
  }
  if (pagination.dateTo) {
    const end = new Date(pagination.dateTo);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: end };
  }
  if (pagination.status) {
    const ids = pagination.status.split(',');
    where.doctorId = { in: ids };
  }
  return Promise.all([
    db.prescription.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        patient: { select: { id: true, fullName: true, patientId: true, age: true, gender: true } },
        doctor: { select: { id: true, fullName: true, clinicName: true } },
        medicines: { select: { name: true, form: true } },
        _count: { select: { medicines: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.prescription.count({ where }),
  ] as const);
};

export const getMrRevenueReport = (mrId: string) => {
  const now = new Date();
  const monthlyRevenue = Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const ms = new Date(now.getFullYear(), i, 1);
      const me = new Date(now.getFullYear(), i + 1, 1);
      return db.payment.aggregate({
        where: { paidByMrId: mrId, createdAt: { gte: ms, lt: me } },
        _sum: { amount: true },
      });
    })
  );
  return monthlyRevenue.then((r) => r.map((x: { _sum: { amount: number | null } }) => x._sum.amount || 0));
};

export const getMrRevenueByDoctor = (mrId: string) =>
  db.payment.groupBy({
    by: ['subscriptionId'],
    where: { paidByMrId: mrId },
    _sum: { amount: true },
    _count: true,
  });

export const getRecentPrescriptions = (doctorIds: string[], take: number) =>
  db.prescription.findMany({
    where: { doctorId: { in: doctorIds } },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

export const getExpiringSoonSubscriptions = (doctorIds: string[], withinDays: number) => {
  const now = new Date();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + withinDays);
  return db.subscription.findMany({
    where: {
      doctorId: { in: doctorIds },
      status: 'ACTIVE',
      endDate: { not: null, gte: now, lte: deadline },
    },
    include: {
      doctor: { select: { id: true, fullName: true } },
      plan: { select: { id: true, name: true } },
    },
    orderBy: { endDate: 'asc' },
  });
};

export const findPrescriptionForMr = (id: string, doctorIds: string[]) =>
  db.prescription.findFirst({
    where: { id, doctorId: { in: doctorIds } },
    include: {
      patient: true,
      medicines: true,
      investigations: true,
      doctor: {
        select: {
          fullName: true,
          degree: true,
          specialization: true,
          bmdcRegNo: true,
          clinicName: true,
          clinicAddress: true,
          phone: true,
          signatureImg: true,
          clinicLogo: true,
          chamberSchedule: true,
        },
      },
    },
  });

export const downgradeExpiredSubscriptions = async (doctorIds: string[]) => {
  const now = new Date();
  const freePlan = await db.plan.findFirst({ where: { price: 0, isActive: true } });
  if (!freePlan) return 0;
  const result = await db.subscription.updateMany({
    where: {
      doctorId: { in: doctorIds },
      status: 'ACTIVE',
      endDate: { not: null, lt: now },
    },
    data: {
      planId: freePlan.id,
      status: 'ACTIVE',
      patientLimit: freePlan.patientLimit,
      prescriptionLimit: freePlan.prescriptionLimit,
    },
  });
  return result.count;
};
