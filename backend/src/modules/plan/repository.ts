import { db } from '../../config/database';

export const findAll = (includeInactive = false) =>
  db.plan.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { price: 'asc' },
  });

export const findById = (id: string) =>
  db.plan.findUnique({ where: { id } });

export const create = (data: {
  name: string;
  description?: string;
  price: number;
  patientLimit: number;
  prescriptionLimit: number;
  duration: number;
}) =>
  db.plan.create({ data });

export const update = (id: string, data: {
  name?: string;
  description?: string;
  price?: number;
  patientLimit?: number;
  prescriptionLimit?: number;
  duration?: number;
  isActive?: boolean;
}) =>
  db.plan.update({ where: { id }, data });

export const remove = (id: string) =>
  db.plan.update({ where: { id }, data: { isActive: false } });
