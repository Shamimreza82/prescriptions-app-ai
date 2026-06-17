import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../types/express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { createAuditLog } from '../../utils/auditLogger';
import * as subscriptionService from './service';

export const getDoctorDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await subscriptionService.getDoctorDashboardStats(req.user!.doctorId!);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await subscriptionService.getAdminDashboardStats();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getMySubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionService.getDoctorSubscription(req.user!.doctorId!);
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [logs, total] = await subscriptionService.getActivityLogs(req.query);
    const { page, limit } = req.query;
    sendPaginated(res, logs, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const getAdminDoctors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [doctors, total] = await subscriptionService.getAdminDoctors(req.query);
    const { page, limit } = req.query;
    sendPaginated(res, doctors, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [users, total] = await subscriptionService.getAdminUsers(req.query);
    const { page, limit } = req.query;
    sendPaginated(res, users, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const getAdminSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [subscriptions, total] = await subscriptionService.getAdminSubscriptions(req.query);
    const { page, limit } = req.query;
    sendPaginated(res, subscriptions, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const deleteLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    const result = await subscriptionService.deleteActivityLogs(startDate, endDate);
    sendSuccess(res, { deleted: result.count }, 200);
  } catch (error) {
    next(error);
  }
};

export const activate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionService.activateSubscription(req.user!.doctorId!, req.body.planId);
    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Subscription',
      entityId: sub.id,
      details: { planId: req.body.planId, doctorId: req.user!.doctorId },
    });
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
};

export const getAdminPatients = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [patients, total] = await subscriptionService.getAdminPatients(req.query);
    const { page, limit } = req.query;
    sendPaginated(res, patients, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};
