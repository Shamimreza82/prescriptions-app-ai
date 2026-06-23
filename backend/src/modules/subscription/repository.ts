import { db } from '../../config/database';

export const getDoctorStats = (doctorId: string) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Promise.all([
    db.patient.count({ where: { doctorId } }),
    db.prescription.count({ where: { doctorId } }),
    db.appointment.count({ where: { doctorId, date: { gte: monthStart } } }),
    db.prescription.count({ where: { doctorId, createdAt: { gte: monthStart } } }),
    db.prescription.count({ where: { doctorId, createdAt: { gte: todayStart } } }),
    Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const ms = new Date(now.getFullYear(), i, 1);
        const me = new Date(now.getFullYear(), i + 1, 1);
        return db.prescription.count({ where: { doctorId, createdAt: { gte: ms, lt: me } } });
      })
    ),
  ] as const);
};

export const getAdminStats = () =>
  Promise.all([
    db.doctor.count(),
    db.doctor.count({ where: { user: { isActive: true } } }),
    db.patient.count(),
    db.prescription.count(),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.subscription.groupBy({ by: ['planId'], _count: true }),
    db.subscription.groupBy({ by: ['status'], _count: true }),
    db.subscription.count({ where: { status: 'PENDING' } }),
    db.user.count({ where: { role: 'DOCTOR', isVerified: false } }),
  ] as const);

export const getSubscriptionByDoctor = (doctorId: string) =>
  db.subscription.findUnique({
    where: { doctorId },
    include: { plan: true },
  });

export const activatePlan = (doctorId: string, planId: string, patientLimit: number, prescriptionLimit: number, endDate: Date | null) =>
  db.subscription.upsert({
    where: { doctorId },
    update: {
      planId,
      status: 'ACTIVE',
      patientLimit,
      prescriptionLimit,
      startDate: new Date(),
      endDate,
    },
    create: {
      doctorId,
      planId,
      status: 'ACTIVE',
      patientLimit,
      prescriptionLimit,
      startDate: new Date(),
      endDate,
    },
    include: { plan: true },
  });

export const deleteAuditLogs = (startDate: string, endDate: string) => {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return db.auditLog.deleteMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: end,
      },
    },
  });
};

export const deleteAuditLogById = (id: string) =>
  db.auditLog.delete({ where: { id } });

export const deleteAuditLogsByIds = (ids: string[]) =>
  db.auditLog.deleteMany({ where: { id: { in: ids } } });

export const getAuditLogs = (pagination: { skip: number; limit: number; search: string; dateFrom?: string; dateTo?: string }) => {
  const where: any = {};
  if (pagination.search) {
    where.OR = [
      { action: { contains: pagination.search, mode: 'insensitive' } },
      { entity: { contains: pagination.search, mode: 'insensitive' } },
      { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }
  if (pagination.dateFrom || pagination.dateTo) {
    where.createdAt = {};
    if (pagination.dateFrom) where.createdAt.gte = new Date(pagination.dateFrom);
    if (pagination.dateTo) {
      const end = new Date(pagination.dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  return Promise.all([
    db.auditLog.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.auditLog.count({ where }),
  ] as const);
};

export const getAllDoctorsForAdmin = (pagination: { skip: number; limit: number; search: string }, filters: { verified?: string; status?: string } = {}) => {
  const where: any = {};
  const userFilter: any = {};
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { bmdcRegNo: { contains: pagination.search, mode: 'insensitive' } },
      { clinicName: { contains: pagination.search, mode: 'insensitive' } },
      { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
    ];
  }
  if (filters.verified === 'verified') where.isProfileComplete = true;
  if (filters.verified === 'unverified') where.isProfileComplete = false;
  if (filters.status === 'active') userFilter.isActive = true;
  if (filters.status === 'inactive') userFilter.isActive = false;
  if (Object.keys(userFilter).length > 0) where.user = userFilter;
  return Promise.all([
    db.doctor.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        user: { select: { id: true, email: true, isActive: true, isVerified: true, createdAt: true } },
        subscription: true,
        _count: { select: { patients: true, prescriptions: true, appointments: true } },
        mrAssignments: {
          include: {
            mr: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.doctor.count({ where }),
  ] as const);
};

export const getAllUsers = (pagination: { skip: number; limit: number; search: string }, filters: { status?: string; verified?: string; role?: string } = {}) => {
  const where: any = {};
  if (pagination.search) {
    where.OR = [
      { email: { contains: pagination.search, mode: 'insensitive' } },
    ];
  }
  if (filters.status === 'active') where.isActive = true;
  if (filters.status === 'suspended') where.isActive = false;
  if (filters.verified === 'verified') where.isVerified = true;
  if (filters.verified === 'unverified') where.isVerified = false;
  if (filters.role) where.role = filters.role;
  return Promise.all([
    db.user.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        doctor: { select: { id: true, fullName: true, clinicName: true } },
        receptionist: { select: { id: true, fullName: true } },
        mr: { select: { id: true, fullName: true } },
        _count: { select: { auditLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.count({ where }),
  ] as const);
};

export const getAllPatientsForAdmin = (pagination: { skip: number; limit: number; search: string }) => {
  const where: any = {};
  if (pagination.search) {
    where.OR = [
      { fullName: { contains: pagination.search, mode: 'insensitive' } },
      { patientId: { contains: pagination.search, mode: 'insensitive' } },
      { phone: { contains: pagination.search, mode: 'insensitive' } },
    ];
  }
  return Promise.all([
    db.patient.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        doctor: { select: { id: true, fullName: true, clinicName: true } },
        _count: { select: { prescriptions: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.patient.count({ where }),
  ] as const);
};

export const getAllSubscriptions = (pagination: { skip: number; limit: number; search: string; status?: string; planId?: string }) => {
  const where: any = {};
  if (pagination.status) where.status = pagination.status;
  if (pagination.planId) where.planId = pagination.planId;
  if (pagination.search) {
    where.doctor = {
      OR: [
        { fullName: { contains: pagination.search, mode: 'insensitive' } },
        { clinicName: { contains: pagination.search, mode: 'insensitive' } },
      ],
    };
  }
  return Promise.all([
    db.subscription.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            clinicName: true,
            user: { select: { email: true } },
          },
        },
        plan: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.subscription.count({ where }),
  ] as const);
};
