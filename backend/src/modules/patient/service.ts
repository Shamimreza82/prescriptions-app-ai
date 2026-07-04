import { badRequest, notFound } from '../../utils/errors';
import { getPaginationParams } from '../../utils/pagination';
import { db } from '../../config/database';
import * as repo from './repository';
import { CreatePatientInput, UpdatePatientInput } from './types';
import { Request } from 'express';

const checkDuplicatePhone = async (phone: string | undefined, doctorId: string, excludePatientId?: string) => {
  if (!phone) return;
  const existing = await db.patient.findFirst({
    where: { phone, doctorId, ...(excludePatientId ? { id: { not: excludePatientId } } : {}) },
  });
  if (existing) throw badRequest('A patient with this phone number already exists under your account');
};

export const createPatientForDoctor = async (doctorId: string, input: CreatePatientInput) => {
  await checkDuplicatePhone(input.phone, doctorId);
  const subscription = await repo.getSubscriptionByDoctor(doctorId);
  if (!subscription) throw badRequest('No subscription found');
  if (subscription.status !== 'ACTIVE') throw badRequest('Your subscription is not active');

  const count = await repo.countPatientsByDoctor(doctorId);
  if (count >= subscription.patientLimit) {
    throw badRequest('Patient limit reached. Upgrade your subscription.');
  }

  return repo.createPatient({ ...input, doctorId });
};

export const getPatientsByDoctor = async (doctorId: string, query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.findPatientsByDoctor(doctorId, pagination);
};

export const getPatientById = async (id: string, doctorId: string) => {
  const patient = await repo.findPatientById(id, doctorId);
  if (!patient) throw notFound('Patient not found');
  return patient;
};

export const updatePatientForDoctor = async (id: string, doctorId: string, input: UpdatePatientInput) => {
  const patient = await repo.findPatientById(id, doctorId);
  if (!patient) throw notFound('Patient not found');
  await checkDuplicatePhone(input.phone, doctorId, id);
  return repo.updatePatient(id, input);
};

export const deletePatientForDoctor = async (id: string, doctorId: string) => {
  const patient = await repo.findPatientById(id, doctorId);
  if (!patient) throw notFound('Patient not found');
  await repo.deletePatient(id);
};
