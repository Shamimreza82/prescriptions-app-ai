import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// Module routes
import authRoutes from './modules/auth/route';
import doctorRoutes from './modules/doctor/route';
import patientRoutes from './modules/patient/route';
import prescriptionRoutes from './modules/prescription/route';
import appointmentRoutes from './modules/appointment/route';
import notificationRoutes from './modules/notification/route';
import subscriptionRoutes from './modules/subscription/route';
import mrRoutes from './modules/mr/route';
import receptionistRoutes from './modules/receptionist/route';
import planRoutes from './modules/plan/route';
import adminRoutes from './modules/admin/route';

const app = express();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'test' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'test' ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(hpp());
app.use('/api', limiter);
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', subscriptionRoutes);
app.use('/api/mr', mrRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
