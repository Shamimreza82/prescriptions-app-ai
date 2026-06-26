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
    where: { user: { isActive: true, isVerified: true } },
    select: { id: true, fullName: true, clinicName: true, bmdcRegNo: true, userId: true, user: { select: { email: true, isVerified: true } } },
    orderBy: { fullName: 'asc' },
  });

export const getMyDoctorsPaginated = (mrId: string, pagination: PaginationParams) => {
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
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { clinicName: { contains: pagination.search, mode: 'insensitive' } },
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
