import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { createAuditLog } from '../utils/auditLogger';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const userId = (req as any).user?.userId;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { err, userId, path: req.path, method: req.method, ip: req.ip });
      createAuditLog({ userId, action: 'ERROR', entity: 'System', details: { error: err.message, statusCode: err.statusCode }, ipAddress: req.ip }).catch(() => {});
    } else {
      logger.warn(err.message, { err, userId, path: req.path, method: req.method });
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error(err.message, { err, userId, path: req.path, method: req.method, ip: req.ip });
  createAuditLog({ userId, action: 'ERROR', entity: 'System', details: { error: err.message, stack: err.stack }, ipAddress: req.ip }).catch(() => {});
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};
