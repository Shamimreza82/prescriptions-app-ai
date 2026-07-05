import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import * as adminController from './controller';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/doctors', adminController.listDoctors);
router.patch('/doctors/:userId/approve', adminController.approveDoctor);
router.patch('/doctors/:userId/verify', adminController.toggleDoctorVerification);
router.patch('/doctors/:userId/status', adminController.toggleDoctorStatus);
router.get('/users/:userId', adminController.getUser);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/doctors/:userId', adminController.deleteDoctor);
router.post('/doctors/:userId/reset-password', adminController.resetDoctorPassword);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);
router.get('/subscriptions', adminController.listSubscriptions);
router.patch('/subscriptions/:id', adminController.updateSubscription);

router.post('/doctors/:doctorId/clear-mr', adminController.clearDoctorMrAssignments);

router.post('/doctors/:doctorId/upload-profile-img', upload.single('profile-img'), adminController.uploadDoctorProfileImg);
router.post('/doctors/:doctorId/upload-signature', upload.single('signature'), adminController.uploadDoctorSignature);
router.post('/doctors/:doctorId/upload-logo', upload.single('logo'), adminController.uploadDoctorLogo);
router.delete('/doctors/:doctorId/remove-profile-img', adminController.removeDoctorProfileImg);
router.delete('/doctors/:doctorId/remove-signature', adminController.removeDoctorSignature);
router.delete('/doctors/:doctorId/remove-logo', adminController.removeDoctorLogo);

router.get('/plans', adminController.listPlans);
router.get('/plans/:id', adminController.getPlan);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

export default router;
