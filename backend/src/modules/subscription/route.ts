import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { z } from 'zod';
import * as subscriptionController from './controller';

const router = Router();

router.use(authenticate);

router.get('/doctor', authorize('DOCTOR'), subscriptionController.getDoctorDashboard);
router.get('/admin', authorize('SUPER_ADMIN'), subscriptionController.getAdminDashboard);
router.get('/admin/doctors', authorize('SUPER_ADMIN'), subscriptionController.getAdminDoctors);
router.get('/admin/users', authorize('SUPER_ADMIN'), subscriptionController.getAdminUsers);
router.get('/admin/subscriptions', authorize('SUPER_ADMIN'), subscriptionController.getAdminSubscriptions);
router.get('/admin/patients', authorize('SUPER_ADMIN'), subscriptionController.getAdminPatients);
router.get('/my', authorize('DOCTOR'), subscriptionController.getMySubscription);
router.get('/logs', authorize('SUPER_ADMIN'), subscriptionController.getLogs);
router.delete('/logs', authorize('SUPER_ADMIN'), subscriptionController.deleteLogs);
router.post('/activate', authorize('DOCTOR'), validateBody(z.object({ planId: z.string().uuid() })), subscriptionController.activate);

export default router;
