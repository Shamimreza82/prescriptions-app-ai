import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../../config/database';
import { notFound } from '../../utils/errors';
import { sendSuccess } from '../../utils/apiResponse';

const router = Router();

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rx = await db.prescription.findUnique({
      where: { id: req.params.id as string },
      select: {
        prescriptionNo: true,
        createdAt: true,
        patient: { select: { fullName: true, age: true, gender: true } },
        doctor: { select: { fullName: true, degree: true, specialization: true, bmdcRegNo: true, clinicName: true } },
        medicines: { select: { name: true, strength: true, dosage: true, frequency: true, duration: true } },
      },
    });
    if (!rx) throw notFound('Prescription not found');
    sendSuccess(res, rx);
  } catch (error) {
    next(error);
  }
});

export default router;
