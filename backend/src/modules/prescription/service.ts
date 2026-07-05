import { badRequest, notFound, forbidden } from '../../utils/errors';
import { getPaginationParams } from '../../utils/pagination';
import { db } from '../../config/database';
import * as repo from './repository';
import * as subService from '../subscription/service';
import { CreatePrescriptionInput, UpdatePrescriptionInput } from './types';
import { Request } from 'express';

export const createPrescriptionForDoctor = async (doctorId: string, input: CreatePrescriptionInput) => {
  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    include: { user: { select: { isVerified: true } } },
  });

  if (!doctor) throw notFound('Doctor not found');
  if (!doctor.isProfileComplete) throw forbidden('Complete your profile before creating prescriptions');
  if (!doctor.user.isVerified) throw forbidden('Your account is pending admin approval. You cannot create prescriptions yet.');

  const subscription = await subService.autoDowngradeExpiredIfNeeded(doctorId);
  if (!subscription) throw badRequest('No subscription found');
  if (subscription.status !== 'ACTIVE') throw badRequest('Your subscription is not active');

  const count = await repo.countPrescriptionsByDoctor(doctorId);
  if (count >= subscription!.prescriptionLimit) {
    throw badRequest('Prescription limit reached. Upgrade your subscription.');
  }

  const patient = await repo.getPatientByDoctor(input.patientId, doctorId);
  if (!patient) throw notFound('Patient not found');

  return repo.createPrescription({ ...input, doctorId });
};

export const getPrescriptionsByDoctor = async (doctorId: string, query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.findPrescriptionsByDoctor(doctorId, pagination);
};

export const getPrescriptionById = async (id: string, doctorId: string) => {
  const rx = await repo.findPrescriptionById(id, doctorId);
  if (!rx) throw notFound('Prescription not found');
  return rx;
};

export const updatePrescriptionForDoctor = async (id: string, doctorId: string, input: UpdatePrescriptionInput) => {
  const rx = await repo.findPrescriptionById(id, doctorId);
  if (!rx) throw notFound('Prescription not found');
  return repo.updatePrescription(id, { ...input, doctorId });
};

export const deletePrescriptionForDoctor = async (id: string, doctorId: string) => {
  const rx = await repo.findPrescriptionById(id, doctorId);
  if (!rx) throw notFound('Prescription not found');
  await repo.deletePrescription(id);
};
