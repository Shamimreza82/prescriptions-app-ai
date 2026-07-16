import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { Request } from 'express';

const UPLOADS_BASE = path.resolve(__dirname, '../../uploads');

const FIELD_SUBFOLDER: Record<string, string> = {
  'signature': 'signature',
  'logo': 'logo',
  'profile-img': 'profile',
};

function getDoctorId(req: Request): string | null {
  return (req as any).user?.doctorId || req.params?.doctorId || null;
}

async function getDoctorFolder(req: Request): Promise<string> {
  const doctorId = getDoctorId(req);
  if (!doctorId) throw new Error('Doctor ID not found');

  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: { fullName: true },
  });

  const name = doctor?.fullName || 'unknown';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const prefix = doctorId.slice(0, 8);
  return `${slug}_${prefix}`;
}

function createStorage(subfolder?: string) {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const doctorFolder = await getDoctorFolder(req);
        const dir = path.join(UPLOADS_BASE, doctorFolder, subfolder || FIELD_SUBFOLDER[file.fieldname] || 'misc');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      } catch (err) {
        cb(err as Error, '');
      }
    },
    filename: (_req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    },
  });
}

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};

function createUpload(subfolder?: string) {
  return multer({
    storage: createStorage(subfolder),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

export const upload = createUpload();

export const getRelativePath = (file: Express.Multer.File): string =>
  path.relative(UPLOADS_BASE, path.join(file.destination, file.filename));
