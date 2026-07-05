import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../types/express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import * as doctorService from './service';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctor = await doctorService.getDoctorProfile(req.user!.doctorId!);
    sendSuccess(res, doctor);
  } catch (error) {
    next(error);
  }
};

const ALLOWED_FIELDS = [
  'fullName', 'degree', 'specialization', 'bmdcRegNo',
  'clinicName', 'clinicAddress', 'phone', 'chamberSchedule',
];

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.signature?.[0]) data.signatureImg = files.signature[0].filename;
      if (files.logo?.[0]) data.clinicLogo = files.logo[0].filename;
    }
    const doctor = await doctorService.updateDoctorProfile(req.user!.doctorId!, data);
    sendSuccess(res, doctor);
  } catch (error) {
    next(error);
  }
};

export const uploadSignature = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await doctorService.uploadSignature(req.user!.doctorId!, req.file!.filename);
    sendSuccess(res, { signatureImg: result.signatureImg });
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await doctorService.uploadLogo(req.user!.doctorId!, req.file!.filename);
    sendSuccess(res, { clinicLogo: result.clinicLogo });
  } catch (error) {
    next(error);
  }
};

export const removeSignature = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await doctorService.removeSignature(req.user!.doctorId!);
    sendSuccess(res, { signatureImg: result.signatureImg });
  } catch (error) {
    next(error);
  }
};

export const removeLogo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await doctorService.removeLogo(req.user!.doctorId!);
    sendSuccess(res, { clinicLogo: result.clinicLogo });
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImg = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await doctorService.uploadProfileImg(req.user!.doctorId!, req.file!.filename);
    sendSuccess(res, { profileImg: result.profileImg });
  } catch (error) {
    next(error);
  }
};

export const removeProfileImg = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await doctorService.removeProfileImg(req.user!.doctorId!);
    sendSuccess(res, { profileImg: result.profileImg });
  } catch (error) {
    next(error);
  }
};

export const getAllDoctors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [doctors, total] = await doctorService.getAllDoctors(req.query);
    const { page, limit } = req.query;
    sendPaginated(res, doctors, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const getMySubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await doctorService.getDoctorSubscription(req.user!.doctorId!);
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
};

export const activatePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await doctorService.activateSubscription(req.user!.doctorId!, req.body.planId, req.body.transactionId, req.body.notes);
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
};

export const getPendingSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [subs, total] = await doctorService.getPendingSubscriptions(req.query);
    const { page, limit } = req.query;
    sendPaginated(res, subs, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await doctorService.cancelSubscription(req.params.id as string);
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
};

export const rejectSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await doctorService.rejectSubscription(req.params.id as string);
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
};

export const confirmSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await doctorService.confirmSubscription(req.params.id as string);
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
};

