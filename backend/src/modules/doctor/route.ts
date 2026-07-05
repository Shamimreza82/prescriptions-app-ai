import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import { validateBody } from '../../middlewares/validate';
import { z } from 'zod';
import * as doctorController from './controller';

const router = Router();

router.use(authenticate);

router.get('/profile', doctorController.getProfile);
router.put('/profile', upload.fields([
  { name: 'signature', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]), doctorController.updateProfile);
router.post('/upload-signature', upload.single('signature'), doctorController.uploadSignature);
router.post('/upload-logo', upload.single('logo'), doctorController.uploadLogo);
router.delete('/remove-signature', doctorController.removeSignature);
router.delete('/remove-logo', doctorController.removeLogo);
router.post('/upload-profile-img', upload.single('profile-img'), doctorController.uploadProfileImg);
router.delete('/remove-profile-img', doctorController.removeProfileImg);

router.get('/subscription', doctorController.getMySubscription);
router.post('/subscription/activate', validateBody(z.object({ planId: z.string().uuid(), transactionId: z.string().optional(), notes: z.string().optional() })), doctorController.activatePlan);

router.get('/subscription/pending', authorize('SUPER_ADMIN'), doctorController.getPendingSubscriptions);
router.post('/subscription/:id/confirm', authorize('SUPER_ADMIN'), doctorController.confirmSubscription);
router.post('/subscription/:id/reject', authorize('SUPER_ADMIN'), doctorController.rejectSubscription);
router.post('/subscription/:id/cancel', authorize('SUPER_ADMIN'), doctorController.cancelSubscription);

export default router;
