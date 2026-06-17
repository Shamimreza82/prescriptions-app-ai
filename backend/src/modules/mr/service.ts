import { hashPassword } from '../../utils/password';
import { notFound, badRequest } from '../../utils/errors';
import { getPaginationParams } from '../../utils/pagination';
import { db } from '../../config/database';
import * as repo from './repository';
import { CreateMrInput, UpdateMrInput, AssignDoctorsInput } from './types';
import { Request } from 'express';
import { generatePrescriptionPDF } from '../prescription/pdf';
import type { Prisma } from '@prisma/client';

export const getMyProfile = async (userId: string) => {
  const mr = await repo.findMrByUserId(userId);
  if (!mr) throw notFound('MR profile not found');
  return mr;
};

export const getMrById = async (id: string) => {
  const mr = await repo.findMrById(id);
  if (!mr) throw notFound('MR not found');
  return mr;
};

export const getAllMrs = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  const filters = {
    status: query.status as string | undefined,
    verified: query.verified as string | undefined,
    role: query.role as string | undefined,
  };
  return repo.findAllMrs(pagination, filters);
};

export const createMr = async (input: CreateMrInput) => {
  const existing = await repo.findMrByEmail(input.email);
  if (existing) throw badRequest('Email already registered');

  const hashed = await hashPassword(input.password);

  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        password: hashed,
        role: 'MEDICAL_REPRESENTATIVE',
        isVerified: true,
        mr: {
          create: {
            fullName: input.fullName,
            phone: input.phone,
          },
        },
      },
      include: { mr: true },
    });
    return user;
  });

  return result;
};

export const updateMr = async (id: string, input: UpdateMrInput) => {
  const mr = await repo.findMrById(id);
  if (!mr) throw notFound('MR not found');
  return repo.updateMr(id, input);
};

export const deleteMr = async (id: string) => {
  const mr = await repo.findMrById(id);
  if (!mr) throw notFound('MR not found');
  await db.user.delete({ where: { id: mr.userId } });
  return { message: 'MR deleted successfully' };
};

export const assignDoctors = async (mrId: string, input: AssignDoctorsInput) => {
  const mr = await repo.findMrById(mrId);
  if (!mr) throw notFound('MR not found');
  await repo.assignDoctors(mrId, input.doctorIds);
  return repo.findMrById(mrId);
};

export const getMyDoctors = async (userId: string, query: Request['query']) => {
  const mr = await repo.findMrByUserId(userId);
  if (!mr) throw notFound('MR profile not found');
  const pagination = getPaginationParams(query);
  return repo.getMyDoctorsPaginated(mr.id, pagination);
};

export const getDoctorPatients = async (mrUserId: string, doctorId: string) => {
  const mr = await repo.findMrByUserId(mrUserId);
  if (!mr) throw notFound('MR profile not found');
  const assigned = mr.doctors.some((d: { doctorId: string }) => d.doctorId === doctorId);
  if (!assigned) throw badRequest('Doctor is not assigned to you');
  return repo.getDoctorPatients(doctorId);
};

export const getDoctorPrescriptions = async (mrUserId: string, doctorId: string, query: Request['query']) => {
  const mr = await repo.findMrByUserId(mrUserId);
  if (!mr) throw notFound('MR profile not found');
  const assigned = mr.doctors.some((d: { doctorId: string }) => d.doctorId === doctorId);
  if (!assigned) throw badRequest('Doctor is not assigned to you');
  const pagination = getPaginationParams(query);
  return repo.getDoctorPrescriptions(doctorId, pagination);
};

export const getAvailableDoctors = () => repo.findDoctorsForAssignment();

export const getDashboardStats = async (userId: string) => {
  const mr = await repo.findMrByUserId(userId);
  if (!mr) throw notFound('MR profile not found');
  type MrDoctorAssignment = typeof mr.doctors[number];
  const doctorIds = mr.doctors.map((d: MrDoctorAssignment) => d.doctorId);
  const totalDoctors = doctorIds.length;
  const todaysPrescriptions = doctorIds.length > 0
    ? await repo.getTodaysPrescriptionsByDoctors(doctorIds)
    : 0;
  const totalPrescriptions = mr.doctors.reduce(
    (sum: number, d: MrDoctorAssignment) => sum + (d.doctor._count?.prescriptions || 0), 0
  );
  return { totalDoctors, todaysPrescriptions, totalPrescriptions };
};

export const getDoctorPrescriptionById = async (mrUserId: string, doctorId: string, prescriptionId: string) => {
  const mr = await repo.findMrByUserId(mrUserId);
  if (!mr) throw notFound('MR profile not found');
  const assigned = mr.doctors.some((d: { doctorId: string }) => d.doctorId === doctorId);
  if (!assigned) throw badRequest('Doctor is not assigned to you');
  const doctorIds = mr.doctors.map((d: { doctorId: string }) => d.doctorId);
  const rx = await repo.findPrescriptionForMr(prescriptionId, doctorIds);
  if (!rx) throw notFound('Prescription not found');
  return rx;
};

export const downloadDoctorPrescriptionPdf = async (mrUserId: string, doctorId: string, prescriptionId: string) => {
  const rx = await getDoctorPrescriptionById(mrUserId, doctorId, prescriptionId);
  const pdfData = { ...rx, createdAt: rx.createdAt.toISOString() };
  return generatePrescriptionPDF(pdfData);
};
