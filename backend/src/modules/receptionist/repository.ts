import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { PaginationParams } from '../../utils/pagination';

export const findReceptionistByUserId = (userId: string) =>
  db.receptionist.findUnique({
    where: { userId },
    include: { doctor: true },
  });

const generatePatientId = () => `PAT-${uuidv4().substring(0, 6).toUpperCase()}`;

export const countPatientsByDoctor = (doctorId: string) =>
  db.patient.count({ where: { doctorId } });

export const findPatientsByDoctor = (doctorId: string, pagination: PaginationParams) => {
  const where: any = { doctorId };
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { patientId: { contains: pagination.search, mode: 'insensitive' } },
      { phone: { contains: pagination.search } },
    ];
  }

  return Promise.all([
    db.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      include: { _count: { select: { prescriptions: true, appointments: true } } },
    }),
    db.patient.count({ where }),
  ] as const);
};

export const findPatientById = (id: string, doctorId: string) =>
  db.patient.findFirst({
    where: { id, doctorId },
    include: { _count: { select: { appointments: true } } },
  });

export const createPatient = (data: any) =>
  db.patient.create({
    data: {
      ...data,
      patientId: generatePatientId(),
    } as any,
  });

export const updatePatient = (id: string, doctorId: string, data: any) =>
  db.patient.update({
    where: { id },
    data: data as any,
  });

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
      orderBy: { date: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        patient: {
          include: { _count: { select: { appointments: true } } },
        },
      },
    }),
    db.appointment.count({ where }),
  ] as const);
};

export const findAppointmentById = (id: string, doctorId: string) =>
  db.appointment.findFirst({
    where: { id, doctorId },
    include: { patient: { select: { id: true, fullName: true, patientId: true, age: true, gender: true, phone: true } } },
  });

export const createAppointment = (data: any) =>
  db.appointment.create({
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

export const updateAppointment = (id: string, data: any) =>
  db.appointment.update({ where: { id }, data: data as any });

export const findTodayAppointments = (doctorId: string) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return db.appointment.findMany({
    where: { doctorId, date: { gte: start, lte: end } },
    orderBy: { time: 'asc' },
    include: { patient: { select: { id: true, fullName: true, patientId: true } } },
  });
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
        patient: { select: { id: true, fullName: true, patientId: true } },
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
      doctor: { include: { user: { select: { email: true } } } },
      medicines: true,
      investigations: true,
    },
  });

export const getSubscriptionByDoctor = (doctorId: string) =>
  db.subscription.findUnique({ where: { doctorId } });

export const findAllReceptionists = (pagination: PaginationParams) => {
  const where: any = {};
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }

  return Promise.all([
    db.receptionist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      include: { user: { select: { email: true, isActive: true } }, doctor: { select: { id: true, fullName: true } } },
    }),
    db.receptionist.count({ where }),
  ] as const);
};

export const findReceptionistById = (id: string) =>
  db.receptionist.findUnique({ where: { id } });

export const findReceptionistsByDoctor = (doctorId: string, pagination: PaginationParams) => {
  const where: any = { doctorId };
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }
  return Promise.all([
    db.receptionist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      include: { user: { select: { email: true, isActive: true, createdAt: true } } },
    }),
    db.receptionist.count({ where }),
  ] as const);
};

export const updateReceptionist = (id: string, data: { fullName?: string; phone?: string }) =>
  db.receptionist.update({ where: { id }, data });

export const deleteReceptionist = (id: string) =>
  db.receptionist.delete({ where: { id } });
