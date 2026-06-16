import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import * as adminController from './controller';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/doctors', adminController.listDoctors);
router.patch('/doctors/:userId/approve', adminController.approveDoctor);
router.patch('/doctors/:userId/status', adminController.toggleDoctorStatus);
router.get('/users/:userId', adminController.getUser);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/doctors/:userId', adminController.deleteDoctor);
router.post('/doctors/:userId/reset-password', adminController.resetDoctorPassword);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);
router.get('/subscriptions', adminController.listSubscriptions);
router.patch('/subscriptions/:id', adminController.updateSubscription);

router.post('/doctors/:doctorId/clear-mr', adminController.clearDoctorMrAssignments);

router.get('/plans', adminController.listPlans);
router.get('/plans/:id', adminController.getPlan);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

export default router;
