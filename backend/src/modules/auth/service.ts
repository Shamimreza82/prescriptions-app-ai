import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { badRequest, unauthorized } from '../../utils/errors';
import { db } from '../../config/database';
import * as repo from './repository';
import { RegisterInput, LoginInput, Tokens } from './types';
import type { Prisma } from '@prisma/client';

const generateTokens = (payload: {
  userId: string;
  email: string;
  role: string;
  doctorId?: string;
  mrId?: string;
  receptionistId?: string;
}): Tokens => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

export const registerUser = async (input: RegisterInput) => {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) throw badRequest('Email already registered');

  const hashed = await hashPassword(input.password);

  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        password: hashed,
        role: (input.role || 'DOCTOR') as any,
        doctor:
          (input.role || 'DOCTOR') === 'DOCTOR'
              ? {
                  create: {
                    fullName: input.fullName,
                    degree: '',
                    specialization: '',
                    clinicName: '',
                    clinicAddress: '',
                    phone: '',
                  },
                }
              : undefined,
      },
      include: { doctor: true },
    });

    if (user.doctor) {
      const freePlan = await tx.plan.findFirst({ where: { price: 0, isActive: true }, select: { id: true, patientLimit: true, prescriptionLimit: true } });
      if (!freePlan) throw new Error('No free plan found');
      await tx.subscription.create({
        data: {
          doctorId: user.doctor.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          patientLimit: freePlan.patientLimit,
          prescriptionLimit: freePlan.prescriptionLimit,
        },
      });
    }

    return user;
  });

  const payload = {
    userId: result.id,
    email: result.email,
    role: result.role,
    doctorId: result.doctor?.id,
  };

  const tokens = generateTokens(payload);
  await repo.updateRefreshToken(result.id, tokens.refreshToken);

  return {
    user: { id: result.id, email: result.email, role: result.role, doctorId: result.doctor?.id },
    tokens,
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await repo.findUserByEmail(input.email);
  if (!user) throw unauthorized('Invalid credentials');

  const valid = await comparePassword(input.password, user.password);
  if (!valid) throw unauthorized('Invalid credentials');
  if (!user.isActive) throw unauthorized('Account is deactivated');

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    doctorId: user.doctor?.id || user.receptionist?.doctorId,
    mrId: user.mr?.id,
    receptionistId: user.receptionist?.id,
  };

  const tokens = generateTokens(payload);
  await repo.updateRefreshToken(user.id, tokens.refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      doctor: user.doctor,
      mr: user.mr,
      receptionist: user.receptionist,
    },
    tokens,
  };
};

export const refreshUserToken = async (token: string) => {
  try {
    const decoded = verifyRefreshToken(token);
    const user = await repo.findUserById(decoded.userId);
    if (!user || user.refreshToken !== token) throw unauthorized('Invalid refresh token');

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      doctorId: user.doctor?.id || user.receptionist?.doctorId,
      mrId: user.mr?.id,
      receptionistId: user.receptionist?.id,
    };

    const tokens = generateTokens(payload);
    await repo.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  } catch {
    throw unauthorized('Invalid refresh token');
  }
};

export const logoutUser = (userId: string) =>
  repo.updateRefreshToken(userId, null);

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await repo.findUserById(userId);
  if (!user) throw badRequest('User not found');

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw badRequest('Current password is incorrect');

  const hashed = await hashPassword(newPassword);
  await repo.updatePassword(userId, hashed);
};
