import { badRequest, notFound } from '../../utils/errors';
import { getPaginationParams } from '../../utils/pagination';
import { db } from '../../config/database';
import * as repo from './repository';
import * as subService from '../subscription/service';
import { Request } from 'express';
import type { Prisma } from '@prisma/client';

const getReceptionistOrThrow = async (userId: string) => {
  const rec = await repo.findReceptionistByUserId(userId);
  if (!rec) throw notFound('Receptionist profile not found');
  return rec;
};

export const getDashboardStats = async (userId: string) => {
  const rec = await getReceptionistOrThrow(userId);
  const doctorId = rec.doctorId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalPatients, totalPrescriptions, monthlyAppointments, monthlyPrescriptions, todaysPatients, todaysPrescriptions, prescriptions] = await Promise.all([
    repo.countPatientsByDoctor(doctorId),
    repo.countPrescriptionsByDoctor(doctorId),
    db.appointment.count({ where: { doctorId, date: { gte: startOfMonth } } }),
    db.prescription.count({ where: { doctorId, createdAt: { gte: startOfMonth } } }),
    db.patient.count({ where: { doctorId, createdAt: { gte: todayStart } } }),
    db.prescription.count({ where: { doctorId, createdAt: { gte: todayStart } } }),
    db.prescription.findMany({
      where: { doctorId, createdAt: { gte: new Date(now.getFullYear() - 1, 0, 1) } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const monthlyCounts = new Array(12).fill(0);
  prescriptions.forEach((rx: { createdAt: Date }) => {
    const m = new Date(rx.createdAt).getMonth();
    monthlyCounts[m]++;
  });

  return {
    totalPatients,
    totalPrescriptions,
    monthlyAppointments,
    monthlyPrescriptions,
    todaysPatients,
    todaysPrescriptions,
    monthlyData: monthlyCounts,
  } as const;
};

export const getPatientsByDoctor = async (userId: string, query: Request['query']) => {
  const rec = await getReceptionistOrThrow(userId);
  const pagination = getPaginationParams(query);
  return repo.findPatientsByDoctor(rec.doctorId, pagination);
};

export const getPatientById = async (userId: string, patientId: string) => {
  const rec = await getReceptionistOrThrow(userId);
  const patient = await repo.findPatientById(patientId, rec.doctorId);
  if (!patient) throw notFound('Patient not found');
  return patient;
};

const checkDuplicatePhone = async (phone: string | undefined, doctorId: string, excludePatientId?: string) => {
  if (!phone) return;
  const existing = await db.patient.findFirst({
    where: { phone, doctorId, ...(excludePatientId ? { id: { not: excludePatientId } } : {}) },
  });
  if (existing) throw badRequest('A patient with this phone number already exists under your account');
};

export const createPatientForDoctor = async (userId: string, input: any) => {
  const rec = await getReceptionistOrThrow(userId);
  const subscription = await subService.autoDowngradeExpiredIfNeeded(rec.doctorId);
  if (!subscription) throw badRequest('No subscription found');
  if (subscription.status !== 'ACTIVE') throw badRequest('Your subscription is not active');

  const count = await repo.countPatientsByDoctor(rec.doctorId);
  if (count >= subscription!.patientLimit) {
    throw badRequest('Patient limit reached. Upgrade your subscription.');
  }

  await checkDuplicatePhone(input.phone, rec.doctorId);
  return repo.createPatient({ ...input, doctorId: rec.doctorId });
};

export const updatePatientForDoctor = async (userId: string, patientId: string, input: any) => {
  const rec = await getReceptionistOrThrow(userId);
  const patient = await repo.findPatientById(patientId, rec.doctorId);
  if (!patient) throw notFound('Patient not found');
  await checkDuplicatePhone(input.phone, rec.doctorId, patientId);
  return repo.updatePatient(patientId, rec.doctorId, input);
};

export const getDoctorProfile = async (userId: string) => {
  const rec = await getReceptionistOrThrow(userId);
  return rec.doctor;
};

export const getAppointmentsByDoctor = async (userId: string, query: Request['query']) => {
  const rec = await getReceptionistOrThrow(userId);
  const pagination = getPaginationParams(query);
  const status = query.status as string | undefined;
  const search = query.search as string | undefined;
  const dateFrom = query.dateFrom as string | undefined;
  const dateTo = query.dateTo as string | undefined;
  return repo.findAppointmentsByDoctor(rec.doctorId, pagination, status, search, dateFrom, dateTo);
};

export const getTodayAppointments = async (userId: string) => {
  const rec = await getReceptionistOrThrow(userId);
  return repo.findTodayAppointments(rec.doctorId);
};

export const getAppointmentById = async (userId: string, appointmentId: string) => {
  const rec = await getReceptionistOrThrow(userId);
  const apt = await repo.findAppointmentById(appointmentId, rec.doctorId);
  if (!apt) throw notFound('Appointment not found');
  return apt;
};

export const createAppointmentForDoctor = async (userId: string, input: any) => {
  const rec = await getReceptionistOrThrow(userId);
  const patient = await repo.findPatientById(input.patientId, rec.doctorId);
  if (!patient) throw notFound('Patient not found');
  return repo.createAppointment({ ...input, doctorId: rec.doctorId });
};

export const updateAppointmentForDoctor = async (userId: string, appointmentId: string, input: any) => {
  const rec = await getReceptionistOrThrow(userId);
  const apt = await repo.findAppointmentById(appointmentId, rec.doctorId);
  if (!apt) throw notFound('Appointment not found');
  return repo.updateAppointment(appointmentId, input);
};

export const getPrescriptionsByDoctor = async (userId: string, query: Request['query']) => {
  const rec = await getReceptionistOrThrow(userId);
  const pagination = getPaginationParams(query);
  return repo.findPrescriptionsByDoctor(rec.doctorId, pagination);
};

export const getPrescriptionById = async (userId: string, prescriptionId: string) => {
  const rec = await getReceptionistOrThrow(userId);
  const rx = await repo.findPrescriptionById(prescriptionId, rec.doctorId);
  if (!rx) throw notFound('Prescription not found');
  return rx;
};

export const downloadPrescriptionPdf = async (userId: string, prescriptionId: string) => {
  const rx = await getPrescriptionById(userId, prescriptionId);
  const { generatePrescriptionPDF } = await import('../prescription/pdf');
  const pdfData = { ...rx, createdAt: rx.createdAt.toISOString(), updatedAt: rx.updatedAt?.toISOString() };
  return generatePrescriptionPDF(pdfData);
};

export const getAllReceptionists = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.findAllReceptionists(pagination);
};

export const createReceptionist = async (input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  doctorId: string;
}) => {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw badRequest('Email already registered');

  const hashed = await import('../../utils/password').then((m) => m.hashPassword(input.password));

  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        password: hashed,
        role: 'RECEPTIONIST',
        isVerified: true,
        receptionist: {
          create: {
            fullName: input.fullName,
            phone: input.phone,
            doctorId: input.doctorId,
          },
        },
      },
      include: { receptionist: true },
    });
    return user;
  });

  return result;
};

export const deleteReceptionist = async (id: string) => {
  const rec = await repo.findReceptionistById(id);
  if (!rec) throw notFound('Receptionist not found');
  await db.user.delete({ where: { id: rec.userId } });
  return { message: 'Receptionist deleted successfully' };
};

const getDoctorOrThrow = async (userId: string) => {
  const doctor = await db.doctor.findUnique({ where: { userId } });
  if (!doctor) throw notFound('Doctor profile not found');
  return doctor;
};

export const createReceptionistByDoctor = async (doctorUserId: string, input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) => {
  const doctor = await getDoctorOrThrow(doctorUserId);
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw badRequest('Email already registered');

  const hashed = await import('../../utils/password').then((m) => m.hashPassword(input.password));

  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        password: hashed,
        role: 'RECEPTIONIST',
        isVerified: true,
        receptionist: {
          create: {
            fullName: input.fullName,
            phone: input.phone,
            doctorId: doctor.id,
          },
        },
      },
      include: { receptionist: true },
    });
    return user;
  });

  return result;
};

export const getMyReceptionists = async (doctorUserId: string, query: Request['query']) => {
  const doctor = await getDoctorOrThrow(doctorUserId);
  const pagination = getPaginationParams(query);
  return repo.findReceptionistsByDoctor(doctor.id, pagination);
};

export const deleteMyReceptionist = async (doctorUserId: string, receptionistId: string) => {
  const doctor = await getDoctorOrThrow(doctorUserId);
  const rec = await repo.findReceptionistById(receptionistId);
  if (!rec) throw notFound('Receptionist not found');
  if (rec.doctorId !== doctor.id) throw badRequest('This receptionist does not belong to you');
  await db.user.delete({ where: { id: rec.userId } });
  return { message: 'Receptionist deleted successfully' };
};

export const toggleMyReceptionistStatus = async (doctorUserId: string, receptionistId: string) => {
  const doctor = await getDoctorOrThrow(doctorUserId);
  const rec = await repo.findReceptionistById(receptionistId);
  if (!rec) throw notFound('Receptionist not found');
  if (rec.doctorId !== doctor.id) throw badRequest('This receptionist does not belong to you');
  const user = await db.user.findUnique({ where: { id: rec.userId }, select: { isActive: true } });
  if (!user) throw notFound('User not found');
  const updated = await db.user.update({ where: { id: rec.userId }, data: { isActive: !user.isActive } });
  return { isActive: updated.isActive, message: `Receptionist ${updated.isActive ? 'activated' : 'deactivated'} successfully` };
};

export const updateMyReceptionist = async (doctorUserId: string, receptionistId: string, input: { fullName?: string; phone?: string }) => {
  const doctor = await getDoctorOrThrow(doctorUserId);
  const rec = await repo.findReceptionistById(receptionistId);
  if (!rec) throw notFound('Receptionist not found');
  if (rec.doctorId !== doctor.id) throw badRequest('This receptionist does not belong to you');
  return repo.updateReceptionist(receptionistId, input);
};

export const resetReceptionistPassword = async (doctorUserId: string, receptionistId: string, newPassword: string) => {
  const doctor = await getDoctorOrThrow(doctorUserId);
  const rec = await repo.findReceptionistById(receptionistId);
  if (!rec) throw notFound('Receptionist not found');
  if (rec.doctorId !== doctor.id) throw badRequest('This receptionist does not belong to you');
  const hashed = await import('../../utils/password').then((m) => m.hashPassword(newPassword));
  await db.user.update({ where: { id: rec.userId }, data: { password: hashed } });
  return { message: 'Password reset successfully' };
};
