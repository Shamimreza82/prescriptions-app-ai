import { db } from '../../config/database';
import { PaginationParams } from '../../utils/pagination';

export const findDoctorById = (doctorId: string) =>
  db.doctor.findUnique({
    where: { id: doctorId },
    include: { user: { select: { email: true, role: true, isVerified: true } } },
  });

export const updateDoctor = (doctorId: string, data: any) =>
  db.doctor.update({ where: { id: doctorId }, data: { ...data, isProfileComplete: true } });

export const updateSignature = (doctorId: string, filename: string) =>
  db.doctor.update({ where: { id: doctorId }, data: { signatureImg: filename } });

export const updateLogo = (doctorId: string, filename: string) =>
  db.doctor.update({ where: { id: doctorId }, data: { clinicLogo: filename } });

export const findAllDoctors = (pagination: PaginationParams) => {
  const where: any = {};
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { clinicName: { contains: pagination.search, mode: 'insensitive' } },
    ];
  }
  return Promise.all([
    db.doctor.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        user: { select: { id: true, email: true, isActive: true, createdAt: true } },
        subscription: true,
        _count: { select: { patients: true, prescriptions: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.doctor.count({ where }),
  ] as const);
};

export const toggleUserStatus = (userId: string, isActive: boolean) =>
  db.user.update({ where: { id: userId }, data: { isActive } });
