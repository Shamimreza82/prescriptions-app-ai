import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import type { Prisma } from '@prisma/client';
import { CreatePrescriptionInput, UpdatePrescriptionInput } from './types';
import { PaginationParams } from '../../utils/pagination';

const generateRxNo = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RX-${date}-${rand}`;
};

export const countPrescriptionsByDoctor = (doctorId: string) =>
  db.prescription.count({ where: { doctorId } });

export const findPrescriptionsByDoctor = (doctorId: string, pagination: PaginationParams) => {
  const where: any = { doctorId };
  if (pagination.search) {
    where.OR = [
      { prescriptionNo: { contains: pagination.search, mode: 'insensitive' } },
      { patient: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }

  return Promise.all([
    db.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        patient: { select: { id: true, fullName: true, patientId: true, age: true, gender: true } },
        medicines: true,
      },
    }),
    db.prescription.count({ where }),
  ] as const);
};

export const findPrescriptionById = (id: string, doctorId: string) =>
  db.prescription.findFirst({
    where: { id, doctorId },
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

export const createPrescription = (
  data: CreatePrescriptionInput & { doctorId: string }
) => {
  const { medicines, investigations, followUpDate, ...rest } = data;
  return db.prescription.create({
    data: {
      ...rest,
      prescriptionNo: generateRxNo(),
      doctorId: data.doctorId,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      medicines: { create: medicines },
      investigations: investigations?.length
        ? { create: investigations }
        : undefined,
    },
    include: { patient: true, medicines: true, investigations: true },
  });
};

export const updatePrescription = (
  id: string,
  data: UpdatePrescriptionInput & { doctorId: string }
) => {
  const { medicines, investigations, followUpDate, ...rest } = data;
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.medicine.deleteMany({ where: { prescriptionId: id } });
    await tx.investigation.deleteMany({ where: { prescriptionId: id } });
    return tx.prescription.update({
      where: { id },
      data: {
        ...rest,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        medicines: medicines ? { create: medicines } : undefined,
        investigations: investigations?.length
          ? { create: investigations }
          : undefined,
      },
      include: { patient: true, medicines: true, investigations: true },
    });
  });
};

export const deletePrescription = (id: string) =>
  db.prescription.delete({ where: { id } });

export const getPatientByDoctor = (patientId: string, doctorId: string) =>
  db.patient.findFirst({ where: { id: patientId, doctorId } });

export const getSubscriptionByDoctor = (doctorId: string) =>
  db.subscription.findUnique({ where: { doctorId } });
