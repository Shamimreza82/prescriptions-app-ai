import { notFound, badRequest } from '../../utils/errors';
import { getPaginationParams } from '../../utils/pagination';
import { db } from '../../config/database';
import * as repo from './repository';
import * as subService from '../subscription/service';
import { UpdateDoctorInput } from './types';
import { Request } from 'express';

export const getDoctorProfile = (doctorId: string) =>
  repo.findDoctorById(doctorId);

export const updateDoctorProfile = async (doctorId: string, input: UpdateDoctorInput) => {
  const doctor = await repo.findDoctorById(doctorId);
  if (!doctor) throw notFound('Doctor not found');
  return repo.updateDoctor(doctorId, input);
};

export const uploadSignature = async (doctorId: string, filename: string) => {
  const doctor = await repo.findDoctorById(doctorId);
  if (!doctor) throw notFound('Doctor not found');
  return repo.updateSignature(doctorId, filename);
};

export const uploadLogo = async (doctorId: string, filename: string) => {
  const doctor = await repo.findDoctorById(doctorId);
  if (!doctor) throw notFound('Doctor not found');
  return repo.updateLogo(doctorId, filename);
};

export const removeSignature = async (doctorId: string) => {
  const doctor = await repo.findDoctorById(doctorId);
  if (!doctor) throw notFound('Doctor not found');
  return repo.removeSignature(doctorId);
};

export const removeLogo = async (doctorId: string) => {
  const doctor = await repo.findDoctorById(doctorId);
  if (!doctor) throw notFound('Doctor not found');
  return repo.removeLogo(doctorId);
};

export const getAllDoctors = (query: Request['query']) => {
  const pagination = getPaginationParams(query);
  return repo.findAllDoctors(pagination);
};

export const getDoctorSubscription = (doctorId: string) =>
  subService.getDoctorSubscription(doctorId);

export const activateSubscription = (doctorId: string, planId: string, transactionId?: string, notes?: string) =>
  subService.activateDoctorPlan(doctorId, planId, transactionId, notes);

export const getPendingSubscriptions = (query: Request['query']) =>
  subService.getPendingList(query);

export const rejectSubscription = (subscriptionId: string) =>
  subService.rejectPayment(subscriptionId);

export const cancelSubscription = (subscriptionId: string) =>
  subService.cancelByAdmin(subscriptionId);

export const confirmSubscription = (subscriptionId: string) =>
  subService.confirmPayment(subscriptionId);

