import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createMrSchema, updateMrSchema, assignDoctorsSchema, subscribeDoctorSchema } from './validation';
import * as mrController from './controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize('MEDICAL_REPRESENTATIVE'), mrController.getDashboardStats);
router.get('/reports/overview', authorize('MEDICAL_REPRESENTATIVE'), mrController.getReportsOverview);
router.get('/reports/prescriptions', authorize('MEDICAL_REPRESENTATIVE'), mrController.getReportsPrescriptions);
router.get('/reports/medicines', authorize('MEDICAL_REPRESENTATIVE'), mrController.getReportsMedicines);
router.get('/reports/revenue', authorize('MEDICAL_REPRESENTATIVE'), mrController.getReportsRevenue);
router.get('/doctors', authorize('MEDICAL_REPRESENTATIVE'), mrController.getMyDoctors);
router.get('/doctors/:doctorId/patients', authorize('MEDICAL_REPRESENTATIVE'), mrController.getDoctorPatients);
router.get('/doctors/:doctorId/prescriptions', authorize('MEDICAL_REPRESENTATIVE'), mrController.getDoctorPrescriptions);
router.get('/doctors/:doctorId/prescriptions/:id', authorize('MEDICAL_REPRESENTATIVE'), mrController.getDoctorPrescriptionById);
router.get('/doctors/:doctorId/prescriptions/:id/pdf', authorize('MEDICAL_REPRESENTATIVE'), mrController.downloadDoctorPrescriptionPdf);
router.get('/subscriptions', authorize('MEDICAL_REPRESENTATIVE'), mrController.getMrSubscriptions);
router.post('/doctors/:doctorId/subscribe', authorize('MEDICAL_REPRESENTATIVE'), validateBody(subscribeDoctorSchema), mrController.subscribeDoctor);
router.get('/my-profile', authorize('MEDICAL_REPRESENTATIVE'), mrController.getMyProfile);
router.put('/my-profile', authorize('MEDICAL_REPRESENTATIVE'), validateBody(updateMrSchema), mrController.updateMyProfile);

router.get('/available-doctors', authorize('SUPER_ADMIN'), mrController.getAvailableDoctors);
router.get('/', authorize('SUPER_ADMIN'), mrController.getAllMrs);
router.get('/:id', authorize('SUPER_ADMIN'), mrController.getMrById);
router.post('/', authorize('SUPER_ADMIN'), validateBody(createMrSchema), mrController.createMr);
router.put('/:id', authorize('SUPER_ADMIN'), validateBody(updateMrSchema), mrController.updateMr);
router.delete('/:id', authorize('SUPER_ADMIN'), mrController.deleteMr);
router.post('/:id/assign', authorize('SUPER_ADMIN'), validateBody(assignDoctorsSchema), mrController.assignDoctors);

export default router;
