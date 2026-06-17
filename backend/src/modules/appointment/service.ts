import { notFound } from '../../utils/errors';
import { getPaginationParams } from '../../utils/pagination';
import * as repo from './repository';
import { CreateAppointmentInput, UpdateAppointmentInput } from './types';
import { Request } from 'express';

export const createAppointmentForDoctor = (doctorId: string, input: CreateAppointmentInput) =>
  repo.createAppointment({ ...input, doctorId });

export const getAppointmentsByDoctor = (doctorId: string, query: Request['query']) => {
  const pagination = getPaginationParams(query);
  const status = query.status as string | undefined;
  const search = query.search as string | undefined;
  const dateFrom = query.dateFrom as string | undefined;
  const dateTo = query.dateTo as string | undefined;
  return repo.findAppointmentsByDoctor(doctorId, pagination, status, search, dateFrom, dateTo);
};

export const updateAppointmentForDoctor = async (id: string, doctorId: string, input: UpdateAppointmentInput) => {
  const apt = await repo.findAppointmentById(id, doctorId);
  if (!apt) throw notFound('Appointment not found');
  return repo.updateAppointment(id, input);
};

export const getTodayAppointments = (doctorId: string) =>
  repo.findTodayAppointments(doctorId);
