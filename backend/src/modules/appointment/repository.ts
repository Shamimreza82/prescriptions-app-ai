import { db } from '../../config/database';
import { CreateAppointmentInput, UpdateAppointmentInput } from './types';
import { PaginationParams } from '../../utils/pagination';

export const findAppointmentsByDoctor = (doctorId: string, pagination: PaginationParams, status?: string, search?: string, dateFrom?: string, dateTo?: string) => {
  const where: any = { doctorId };
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo + 'T23:59:59.999Z');
  }
  if (search) {
    where.patient = {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { patientId: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  return Promise.all([
    db.appointment.findMany({
      where,
      include: { patient: { select: { id: true, fullName: true, patientId: true, phone: true } } },
      orderBy: { date: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    db.appointment.count({ where }),
  ] as const);
};

export const findAppointmentById = (id: string, doctorId: string) =>
  db.appointment.findFirst({ where: { id, doctorId } });

export const createAppointment = (data: CreateAppointmentInput & { doctorId: string }) =>
  db.appointment.create({
    data: {
      doctorId: data.doctorId,
      patientId: data.patientId,
      date: new Date(data.date),
      time: data.time,
      notes: data.notes,
    },
    include: { patient: { select: { fullName: true, patientId: true } } },
  });

export const updateAppointment = (id: string, data: UpdateAppointmentInput) =>
  db.appointment.update({ where: { id }, data, include: { patient: { select: { fullName: true } } } });

export const findTodayAppointments = (doctorId: string) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return db.appointment.findMany({
    where: { doctorId, date: { gte: start, lte: end } },
    include: { patient: { select: { id: true, fullName: true, patientId: true, phone: true } } },
    orderBy: { time: 'asc' },
  });
};
