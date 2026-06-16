import { AuthRequest } from '../../types/express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as adminService from './service';

export const getDashboardStats = catchAsync(async (_req: AuthRequest, res) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, stats);
});

export const listDoctors = catchAsync(async (req: AuthRequest, res) => {
  const [doctors, total] = await adminService.listDoctors(req.query);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  sendPaginated(res, doctors, total, page, limit);
});

export const approveDoctor = catchAsync(async (req: AuthRequest, res) => {
  await adminService.approveDoctor(req.params.userId as string);
  sendSuccess(res, { message: 'Doctor approved successfully' });
});

export const toggleDoctorStatus = catchAsync(async (req: AuthRequest, res) => {
  await adminService.toggleDoctorStatus(req.params.userId as string);
  sendSuccess(res, { message: 'Doctor status updated' });
});

export const toggleUserStatus = catchAsync(async (req: AuthRequest, res) => {
  const user = await adminService.toggleUserStatus(req.params.userId as string);
  sendSuccess(res, { message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` });
});

export const deleteDoctor = catchAsync(async (req: AuthRequest, res) => {
  await adminService.deleteDoctor(req.params.userId as string);
  sendSuccess(res, { message: 'Doctor deleted successfully' });
});

export const resetDoctorPassword = catchAsync(async (req: AuthRequest, res) => {
  const { newPassword } = req.body;
  await adminService.resetDoctorPassword(req.params.userId as string, newPassword);
  sendSuccess(res, { message: 'Password reset successfully' });
});

export const resetUserPassword = catchAsync(async (req: AuthRequest, res) => {
  const { newPassword } = req.body;
  await adminService.resetUserPassword(req.params.userId as string, newPassword);
  sendSuccess(res, { message: 'Password reset successfully' });
});

export const listSubscriptions = catchAsync(async (req: AuthRequest, res) => {
  const [subscriptions, total] = await adminService.listSubscriptions(req.query);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  sendPaginated(res, subscriptions, total, page, limit);
});

export const updateSubscription = catchAsync(async (req: AuthRequest, res) => {
  const sub = await adminService.updateSubscriptionPlan(req.params.id as string, req.body);
  sendSuccess(res, sub);
});

export const listPlans = catchAsync(async (_req: AuthRequest, res) => {
  const plans = await adminService.listPlans();
  sendSuccess(res, plans);
});

export const getPlan = catchAsync(async (req: AuthRequest, res) => {
  const plan = await adminService.getPlan(req.params.id as string);
  sendSuccess(res, plan);
});

export const createPlan = catchAsync(async (req: AuthRequest, res) => {
  const plan = await adminService.createPlan(req.body);
  sendSuccess(res, plan, 201);
});

export const updatePlan = catchAsync(async (req: AuthRequest, res) => {
  const plan = await adminService.editPlan(req.params.id as string, req.body);
  sendSuccess(res, plan);
});

export const deletePlan = catchAsync(async (req: AuthRequest, res) => {
  await adminService.removePlan(req.params.id as string);
  sendSuccess(res, { message: 'Plan deleted successfully' });
});

export const getUser = catchAsync(async (req: AuthRequest, res) => {
  const user = await adminService.getUser(req.params.userId as string);
  sendSuccess(res, user);
});

export const clearDoctorMrAssignments = catchAsync(async (req: AuthRequest, res) => {
  const result = await adminService.clearDoctorMrAssignments(req.params.doctorId as string);
  sendSuccess(res, result);
});
