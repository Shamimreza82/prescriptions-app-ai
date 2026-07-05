import { NextFunction } from 'express';
import { Response } from 'express';
import { AuthRequest } from '../../types/express';
import { sendSuccess } from '../../utils/apiResponse';
import { createAuditLog } from '../../utils/auditLogger';
import * as authService from './service';

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role } = req.body;
    const result = await authService.registerUser({ email, password, fullName, role });
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    await createAuditLog({
      userId: result.user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: result.user.id,
      ipAddress: req.ip,
    });
    sendSuccess(res, result);
  } catch (error) {
    await createAuditLog({
      action: 'LOGIN_FAILED',
      entity: 'User',
      details: { email: req.body.email, error: (error as any).message },
      ipAddress: req.ip,
    }).catch(() => {});
    next(error);
  }
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tokens = await authService.refreshUserToken(req.body.refreshToken);
    sendSuccess(res, tokens);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await authService.logoutUser(req.user.userId);
      await createAuditLog({
        userId: req.user.userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: req.user.userId,
        ipAddress: req.ip,
      });
    }
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authService.changeUserPassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { findUserById } = await import('./repository');
    const user = await findUserById(req.user!.userId);
    const { password, refreshToken, ...safeUser } = user!;
    sendSuccess(res, safeUser);
  } catch (error) {
    next(error);
  }
};
