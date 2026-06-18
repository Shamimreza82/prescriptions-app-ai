import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../types/express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { createAuditLog } from '../../utils/auditLogger';
import * as prescriptionService from './service';
import { generatePrescriptionPDF } from './pdf';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rx = await prescriptionService.createPrescriptionForDoctor(req.user!.doctorId!, req.body);
    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Prescription',
      entityId: rx.id,
      details: { prescriptionNo: rx.prescriptionNo },
    });
    sendSuccess(res, rx, 201);
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [prescriptions, total] = await prescriptionService.getPrescriptionsByDoctor(req.user!.doctorId!, req.query);
    const { page, limit } = req.query;
    sendPaginated(res, prescriptions, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const findById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rx = await prescriptionService.getPrescriptionById(req.params.id as string, req.user!.doctorId!);
    sendSuccess(res, rx);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rx = await prescriptionService.updatePrescriptionForDoctor(req.params.id as string, req.user!.doctorId!, req.body);
    await createAuditLog({ userId: req.user!.userId, action: 'UPDATE', entity: 'Prescription', entityId: rx.id });
    sendSuccess(res, rx);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prescriptionService.deletePrescriptionForDoctor(req.params.id as string, req.user!.doctorId!);
    await createAuditLog({ userId: req.user!.userId, action: 'DELETE', entity: 'Prescription', entityId: req.params.id as string });
    sendSuccess(res, { message: 'Prescription deleted' });
  } catch (error) {
    next(error);
  }
};

export const downloadPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rx = await prescriptionService.getPrescriptionById(req.params.id as string, req.user!.doctorId!);
    const pdfData = { ...rx, createdAt: rx.createdAt.toISOString(), updatedAt: rx.updatedAt?.toISOString() };
    const pdf = await generatePrescriptionPDF(pdfData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${rx.prescriptionNo}.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
};

export const printPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rx = await prescriptionService.getPrescriptionById(req.params.id as string, req.user!.doctorId!);
    const pdfData = { ...rx, createdAt: rx.createdAt.toISOString(), updatedAt: rx.updatedAt?.toISOString() };
    const pdf = await generatePrescriptionPDF(pdfData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=prescription.pdf');
    res.send(pdf);
  } catch (error) {
    next(error);
  }
};
