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

// ── Tracked Medicine CRUD ──────────────────────────────────────────

export const createTrackedMedicine = (mrId: string, data: { name: string; genericName?: string; strength?: string; form?: string }) =>
  db.trackedMedicine.create({ data: { ...data, mrId } });

export const findAllTrackedMedicines = (mrId: string, pagination?: PaginationParams) => {
  if (!pagination) {
    return db.trackedMedicine.findMany({
      where: { mrId },
      orderBy: { createdAt: 'desc' },
    });
  }
  const where: any = { mrId };
  if (pagination.search) {
    where.OR = [
      { name: { contains: pagination.search, mode: 'insensitive' } },
      { genericName: { contains: pagination.search, mode: 'insensitive' } },
    ];
  }
  return Promise.all([
    db.trackedMedicine.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.trackedMedicine.count({ where }),
  ] as const);
};

export const findActiveTrackedMedicineNames = (mrId: string) =>
  db.trackedMedicine.findMany({
    where: { mrId, isActive: true },
    select: { name: true },
  }).then((rows) => rows.map((r) => r.name));

export const toggleTrackedMedicineStatus = async (id: string, mrId: string) => {
  const med = await db.trackedMedicine.findUnique({ where: { id } });
  if (!med || med.mrId !== mrId) throw new Error('Not found');
  return db.trackedMedicine.update({
    where: { id },
    data: { isActive: !med.isActive },
  });
};

export const deleteTrackedMedicine = (id: string, mrId: string) =>
  db.trackedMedicine.delete({ where: { id, mrId } });

// ── Audit Queries ──────────────────────────────────────────────────

export const getAuditOverview = async (mrId: string) => {
  const mr = await db.mr.findUnique({
    where: { id: mrId },
    include: { doctors: { select: { doctorId: true } } },
  });
  if (!mr) throw new Error('MR not found');
  const doctorIds = mr.doctors.map((d) => d.doctorId);
  const trackedNames = await findActiveTrackedMedicineNames(mrId);

  if (doctorIds.length === 0 || trackedNames.length === 0) {
    return {
      trackedMedicinesCount: 0,
      activeTrackedMedicinesCount: 0,
      doctorsPrescribingTracked: 0,
      totalTrackedPrescriptions: 0,
      topTrackedMedicine: null,
      thisMonthTracked: 0,
      lastMonthTracked: 0,
      trendPercent: 0,
    };
  }

  const [totalTracked, medicineRanking, doctorsPrescribing, trackedCount, thisMonthCount, lastMonthCount] = await Promise.all([
    // Total prescriptions containing any tracked medicine
    db.prescription.count({
      where: {
        doctorId: { in: doctorIds },
        medicines: { some: { name: { in: trackedNames } } },
      },
    }),
    // Top tracked medicine
    db.medicine.groupBy({
      by: ['name'],
      where: {
        name: { in: trackedNames },
        prescription: { doctorId: { in: doctorIds } },
      },
      _count: { name: true },
      orderBy: { _count: { name: 'desc' } },
      take: 1,
    }),
    // How many doctors prescribed at least one tracked medicine
    db.prescription.groupBy({
      by: ['doctorId'],
      where: {
        doctorId: { in: doctorIds },
        medicines: { some: { name: { in: trackedNames } } },
      },
    }),
    // Active tracked medicines count
    db.trackedMedicine.count({ where: { mrId, isActive: true } }),
    // This month
    (() => {
      const now = new Date();
      const ms = new Date(now.getFullYear(), now.getMonth(), 1);
      const me = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return db.prescription.count({
        where: {
          doctorId: { in: doctorIds },
          medicines: { some: { name: { in: trackedNames } } },
          createdAt: { gte: ms, lt: me },
        },
      });
    })(),
    // Last month
    (() => {
      const now = new Date();
      const ms = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const me = new Date(now.getFullYear(), now.getMonth(), 1);
      return db.prescription.count({
        where: {
          doctorId: { in: doctorIds },
          medicines: { some: { name: { in: trackedNames } } },
          createdAt: { gte: ms, lt: me },
        },
      });
    })(),
  ]);

  const topMedicine = medicineRanking.length > 0
    ? { name: medicineRanking[0].name, count: medicineRanking[0]._count.name }
    : null;

  const trendPercent = lastMonthCount === 0
    ? (thisMonthCount > 0 ? 100 : 0)
    : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);

  return {
    trackedMedicinesCount: trackedNames.length,
    activeTrackedMedicinesCount: trackedCount,
    doctorsPrescribingTracked: doctorsPrescribing.length,
    totalTrackedPrescriptions: totalTracked,
    topTrackedMedicine: topMedicine,
    thisMonthTracked: thisMonthCount,
    lastMonthTracked: lastMonthCount,
    trendPercent,
  };
};

export const getDoctorAudit = async (mrId: string, pagination: { skip: number; limit: number }) => {
  const mr = await db.mr.findUnique({ where: { id: mrId }, include: { doctors: { select: { doctorId: true } } } });
  if (!mr) throw new Error('MR not found');
  const doctorIds = mr.doctors.map((d) => d.doctorId);
  const trackedNames = await findActiveTrackedMedicineNames(mrId);

  if (doctorIds.length === 0 || trackedNames.length === 0) {
    return { data: [], total: 0 };
  }

  const total = doctorIds.length;

  // Fetch doctors with their prescription data
  const doctors = await db.doctor.findMany({
    where: { id: { in: doctorIds } },
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      id: true,
      fullName: true,
      clinicName: true,
      _count: { select: { prescriptions: true } },
    },
    orderBy: { fullName: 'asc' },
  });

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const data = await Promise.all(
    doctors.map(async (doctor) => {
      const [trackedCount, lastRx, thisMonthCount, lastMonthCount] = await Promise.all([
        db.prescription.count({
          where: {
            doctorId: doctor.id,
            medicines: { some: { name: { in: trackedNames } } },
          },
        }),
        db.prescription.findFirst({
          where: {
            doctorId: doctor.id,
            medicines: { some: { name: { in: trackedNames } } },
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        db.prescription.count({
          where: {
            doctorId: doctor.id,
            medicines: { some: { name: { in: trackedNames } } },
            createdAt: { gte: currentMonthStart },
          },
        }),
        db.prescription.count({
          where: {
            doctorId: doctor.id,
            medicines: { some: { name: { in: trackedNames } } },
            createdAt: { gte: prevMonthStart, lt: currentMonthStart },
          },
        }),
      ]);

      const totalRx = doctor._count?.prescriptions || 0;
      const engagementPercent = totalRx === 0 ? 0 : Math.round((trackedCount / totalRx) * 100);

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (thisMonthCount > lastMonthCount) trend = 'up';
      else if (thisMonthCount < lastMonthCount) trend = 'down';

      return {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        clinicName: doctor.clinicName || '',
        totalPrescriptions: totalRx,
        trackedPrescriptions: trackedCount,
        engagementPercent,
        lastPrescriptionDate: lastRx?.createdAt.toISOString() || null,
        trend,
      };
    })
  );

  return { data, total };
};

export const getMedicineAudit = async (mrId: string, pagination: { skip: number; limit: number }) => {
  const mr = await db.mr.findUnique({ where: { id: mrId }, include: { doctors: { select: { doctorId: true } } } });
  if (!mr) throw new Error('MR not found');
  const doctorIds = mr.doctors.map((d) => d.doctorId);
  const trackedMedicines = await db.trackedMedicine.findMany({
    where: { mrId, isActive: true },
    select: { name: true, genericName: true, strength: true, form: true },
  });

  if (doctorIds.length === 0 || trackedMedicines.length === 0) {
    return { data: [], total: 0 };
  }

  const trackedNames = trackedMedicines.map((m) => m.name);

  // Get all matching medicines from prescriptions
  const medicineGroups = await db.medicine.groupBy({
    by: ['name'],
    where: {
      name: { in: trackedNames },
      prescription: { doctorId: { in: doctorIds } },
    },
    _count: { name: true },
    orderBy: { _count: { name: 'desc' } },
    skip: pagination.skip,
    take: pagination.limit,
  });

  const total = trackedMedicines.length;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const data = await Promise.all(
    medicineGroups.map(async (mg) => {
      const tracked = trackedMedicines.find((t) => t.name === mg.name);
      const [doctorsCount, thisMonthCount, lastMonthCount] = await Promise.all([
        db.prescription.groupBy({
          by: ['doctorId'],
          where: {
            doctorId: { in: doctorIds },
            medicines: { some: { name: mg.name } },
          },
        }).then((r) => r.length),
        db.prescription.count({
          where: {
            doctorId: { in: doctorIds },
            medicines: { some: { name: mg.name } },
            createdAt: { gte: currentMonthStart },
          },
        }),
        db.prescription.count({
          where: {
            doctorId: { in: doctorIds },
            medicines: { some: { name: mg.name } },
            createdAt: { gte: prevMonthStart, lt: currentMonthStart },
          },
        }),
      ]);

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (thisMonthCount > lastMonthCount) trend = 'up';
      else if (thisMonthCount < lastMonthCount) trend = 'down';

      return {
        name: mg.name,
        genericName: tracked?.genericName || null,
        strength: tracked?.strength || null,
        form: tracked?.form || null,
        totalPrescriptions: mg._count.name,
        doctorsCount,
        trend,
      };
    })
  );

  return { data, total };
};

export const getAuditTrends = async (mrId: string, filters?: { doctorId?: string; medicineName?: string }) => {
  const mr = await db.mr.findUnique({ where: { id: mrId }, include: { doctors: { select: { doctorId: true } } } });
  if (!mr) throw new Error('MR not found');
  let doctorIds = mr.doctors.map((d) => d.doctorId);
  const trackedNames = await findActiveTrackedMedicineNames(mrId);

  if (filters?.doctorId) {
    if (!doctorIds.includes(filters.doctorId)) throw new Error('Doctor not assigned');
    doctorIds = [filters.doctorId];
  }

  const medicineFilter = filters?.medicineName
    ? [filters.medicineName]
    : trackedNames;

  if (doctorIds.length === 0 || medicineFilter.length === 0) {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
      count: 0,
    }));
  }

  const now = new Date();
  const months = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const ms = new Date(now.getFullYear(), i, 1);
      const me = new Date(now.getFullYear(), i + 1, 1);
      return db.prescription.count({
        where: {
          doctorId: { in: doctorIds },
          medicines: { some: { name: { in: medicineFilter } } },
          createdAt: { gte: ms, lt: me },
        },
      });
    })
  );

  return months.map((count, i) => ({
    month: new Date(now.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }),
    count,
  }));
};

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
