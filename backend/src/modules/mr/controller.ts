import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../types/express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import * as mrService from './service';

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mr = await mrService.getMyProfile(req.user!.userId);
    sendSuccess(res, mr);
  } catch (error) {
    next(error);
  }
};

export const getMrById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mr = await mrService.getMrById(req.params.id as string);
    sendSuccess(res, mr);
  } catch (error) {
    next(error);
  }
};

export const getAllMrs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [mrs, total] = await mrService.getAllMrs(req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, mrs, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const createMr = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.createMr(req.body);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateMr = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.updateMr(req.params.id as string, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.updateMyProfile(req.user!.userId, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteMr = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.deleteMr(req.params.id as string);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const assignDoctors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.assignDoctors(req.params.id as string, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMyDoctors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [doctors, total] = await mrService.getMyDoctors(req.user!.userId, req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, doctors, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getDoctorPatients = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patients = await mrService.getDoctorPatients(req.user!.userId, req.params.doctorId as string);
    sendSuccess(res, patients);
  } catch (error) {
    next(error);
  }
};

export const getDoctorPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [prescriptions, total] = await mrService.getDoctorPrescriptions(req.user!.userId, req.params.doctorId as string, req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    sendPaginated(res, prescriptions, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getAvailableDoctors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctors = await mrService.getAvailableDoctors();
    sendSuccess(res, doctors);
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await mrService.getDashboardStats(req.user!.userId);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getDoctorPrescriptionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rx = await mrService.getDoctorPrescriptionById(req.user!.userId, req.params.doctorId as string, req.params.id as string);
    sendSuccess(res, rx);
  } catch (error) {
    next(error);
  }
};

export const downloadDoctorPrescriptionPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pdf = await mrService.downloadDoctorPrescriptionPdf(req.user!.userId, req.params.doctorId as string, req.params.id as string);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
};

export const getReportsOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.getReportsOverview(req.user!.userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getReportsPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.getReportsPrescriptions(req.user!.userId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getReportsMedicines = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.getReportsMedicines(req.user!.userId, req.query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getReportsRevenue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.getReportsRevenue(req.user!.userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMrSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.getMrSubscriptionsPaginated(req.user!.userId, req.query);
    res.status(200).json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      mr: result.mr,
      platform: result.platform,
    });
  } catch (error) {
    next(error);
  }
};

export const subscribeDoctor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mrService.subscribeDoctor(req.user!.userId, req.params.doctorId as string, req.body);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};
