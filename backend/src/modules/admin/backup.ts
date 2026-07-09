import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../types/express';
import { sendSuccess } from '../../utils/apiResponse';
import { catchAsync } from '../../utils/catchAsync';
import { badRequest } from '../../utils/errors';
import { createAuditLog } from '../../utils/auditLogger';
import { env } from '../../config/env';

const execAsync = promisify(exec);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

const BACKUP_DIR = path.resolve(env.backup.dir);

const backupUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BACKUP_DIR),
    filename: (_req, file, cb) => cb(null, `restore_${uuidv4()}.sql.gz`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    cb(null, file.originalname.endsWith('.sql.gz'));
  },
});

export const restoreUpload = backupUpload.single('backup');

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(1)} ${units[unitIdx]}`;
}

export const createBackup = catchAsync(async (req: AuthRequest, res: Response) => {
  const scriptPath = path.resolve(__dirname, '../../../scripts/backup-db.sh');
  const { stdout } = await execAsync(`bash "${scriptPath}"`, {
    env: { ...process.env, BACKUP_DIR },
  });
  const match = stdout.match(/pres_manage_\d+\.sql\.gz/);
  const filename = match ? match[0] : 'unknown';

  await createAuditLog({
    userId: req.user!.userId,
    action: 'CREATE',
    entity: 'Backup',
    entityId: filename,
    details: { action: 'manual_backup' },
  });

  sendSuccess(res, { filename, message: 'Backup created successfully' });
});

export const listBackups = catchAsync(async (_req: AuthRequest, res: Response) => {
  if (!fs.existsSync(BACKUP_DIR)) {
    sendSuccess(res, []);
    return;
  }

  const files = await readdir(BACKUP_DIR);
  const backupFiles: Array<{ filename: string; size: number; sizeFormatted: string; createdAt: string }> = [];

  for (const file of files) {
    if (!file.startsWith('pres_manage_') || !file.endsWith('.sql.gz')) continue;
    const filePath = path.join(BACKUP_DIR, file);
    const stats = await stat(filePath);
    if (!stats.isFile()) continue;
    backupFiles.push({
      filename: file,
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
      createdAt: stats.mtime.toISOString(),
    });
  }

  backupFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  sendSuccess(res, backupFiles);
});

export const downloadBackup = catchAsync(async (req: AuthRequest, res: Response) => {
  const filename = req.params.filename as string;

  if (!filename || !filename.startsWith('pres_manage_') || !filename.endsWith('.sql.gz')) {
    throw badRequest('Invalid backup filename');
  }

  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw badRequest('Backup file not found');
  }

  res.download(filePath, filename);
});

export const deleteBackup = catchAsync(async (req: AuthRequest, res: Response) => {
  const filename = req.params.filename as string;

  if (!filename || !filename.startsWith('pres_manage_') || !filename.endsWith('.sql.gz')) {
    throw badRequest('Invalid backup filename');
  }

  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw badRequest('Backup file not found');
  }

  await unlink(filePath);

  await createAuditLog({
    userId: req.user!.userId,
    action: 'DELETE',
    entity: 'Backup',
    entityId: filename,
  });

  sendSuccess(res, { message: 'Backup deleted successfully' });
});

export const restoreBackup = catchAsync(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) throw badRequest('No backup file uploaded');

  if (!file.originalname.endsWith('.sql.gz')) {
    throw badRequest('File must be a .sql.gz backup file');
  }

  const dbUrl = env.db.url.split('?')[0];
  if (!dbUrl) throw badRequest('DATABASE_URL not configured');

  await createAuditLog({
    userId: req.user!.userId,
    action: 'UPDATE',
    entity: 'Database',
    details: { action: 'restore_from_backup', filename: file.originalname },
  });

  await execAsync(`gunzip -c "${file.path}" | psql "${dbUrl}"`, { timeout: 1800000 });

  fs.unlink(file.path, () => {});

  sendSuccess(res, { message: 'Database restored successfully' });
});
