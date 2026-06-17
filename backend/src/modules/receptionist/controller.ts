import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../types/express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { createAuditLog } from '../../utils/auditLogger';
import * as receptionistService from './service';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await receptionistService.getDashboardStats(req.user!.userId);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getPatients = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [patients, total] = await receptionistService.getPatientsByDoctor(req.user!.userId, req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, patients, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await receptionistService.getPatientById(req.user!.userId, req.params.id as string);
    sendSuccess(res, patient);
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await receptionistService.createPatientForDoctor(req.user!.userId, req.body);
    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Patient',
      entityId: patient.id,
      details: { patientName: patient.fullName },
    });
    sendSuccess(res, patient, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await receptionistService.updatePatientForDoctor(req.user!.userId, req.params.id as string, req.body);
    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'Patient',
      entityId: patient.id,
    });
    sendSuccess(res, patient);
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [appointments, total] = await receptionistService.getAppointmentsByDoctor(req.user!.userId, req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, appointments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getTodayAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointments = await receptionistService.getTodayAppointments(req.user!.userId);
    sendSuccess(res, appointments);
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apt = await receptionistService.createAppointmentForDoctor(req.user!.userId, req.body);
    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: apt.id,
      details: { patientId: apt.patientId, date: apt.date },
    });
    sendSuccess(res, apt, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apt = await receptionistService.updateAppointmentForDoctor(req.user!.userId, req.params.id as string, req.body);
    await createAuditLog({ userId: req.user!.userId, action: 'UPDATE', entity: 'Appointment', entityId: apt.id });
    sendSuccess(res, apt);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [prescriptions, total] = await receptionistService.getPrescriptionsByDoctor(req.user!.userId, req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, prescriptions, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rx = await receptionistService.getPrescriptionById(req.user!.userId, req.params.id as string);
    sendSuccess(res, rx);
  } catch (error) {
    next(error);
  }
};

export const downloadPrescriptionPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pdf = await receptionistService.downloadPrescriptionPdf(req.user!.userId, req.params.id as string);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [receptionists, total] = await receptionistService.getAllReceptionists(req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, receptionists, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const createReceptionist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await receptionistService.createReceptionist(req.body);
    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Receptionist',
      entityId: result.id,
      details: { email: result.email },
    });
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await receptionistService.deleteReceptionist(req.params.id as string);
    await createAuditLog({ userId: req.user!.userId, action: 'DELETE', entity: 'Receptionist', entityId: req.params.id as string });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMyReceptionists = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [receptionists, total] = await receptionistService.getMyReceptionists(req.user!.userId, req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, receptionists, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const createReceptionistByDoctor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await receptionistService.createReceptionistByDoctor(req.user!.userId, req.body);
    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Receptionist',
      entityId: result.id,
      details: { email: result.email },
    });
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteMyReceptionist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await receptionistService.deleteMyReceptionist(req.user!.userId, req.params.id as string);
    await createAuditLog({ userId: req.user!.userId, action: 'DELETE', entity: 'Receptionist', entityId: req.params.id as string });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
