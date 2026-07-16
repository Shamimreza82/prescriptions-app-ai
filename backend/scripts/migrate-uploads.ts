import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const db = new PrismaClient();
const UPLOADS_BASE = path.resolve(__dirname, '..', 'uploads');

const FIELD_CONFIG = [
  { dbField: 'signatureImg', subfolder: 'signature' },
  { dbField: 'clinicLogo', subfolder: 'logo' },
  { dbField: 'profileImg', subfolder: 'profile' },
] as const;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function migrate() {
  console.log('Starting upload migration...\n');

  const doctors = await db.doctor.findMany({
    where: {
      OR: [
        { signatureImg: { not: null } },
        { clinicLogo: { not: null } },
        { profileImg: { not: null } },
      ],
    },
  });

  console.log(`Found ${doctors.length} doctors with uploaded files.\n`);

  let moved = 0;
  let skipped = 0;

  for (const doctor of doctors) {
    const slug = slugify(doctor.fullName || 'unknown');
    const prefix = doctor.id.slice(0, 8);
    const doctorFolder = `${slug}_${prefix}`;

    for (const { dbField, subfolder } of FIELD_CONFIG) {
      const oldFilename = doctor[dbField as keyof typeof doctor] as string | null;
      if (!oldFilename) continue;

      // Already a path with subfolder? Skip.
      if (oldFilename.includes('/')) {
        console.log(`  [SKIP] ${doctor.id.slice(0, 8)} ${dbField}: already in subfolder format (${oldFilename})`);
        skipped++;
        continue;
      }

      const oldPath = path.join(UPLOADS_BASE, oldFilename);
      if (!fs.existsSync(oldPath)) {
        console.log(`  [MISS] ${doctor.id.slice(0, 8)} ${dbField}: file not found on disk (${oldFilename})`);
        // Still update DB to null for cleanup
        await (db.doctor as any).update({
          where: { id: doctor.id },
          data: { [dbField]: null },
        });
        skipped++;
        continue;
      }

      const targetDir = path.join(UPLOADS_BASE, doctorFolder, subfolder);
      const newRelativePath = `${doctorFolder}/${subfolder}/${oldFilename}`;
      const newPath = path.join(UPLOADS_BASE, newRelativePath);

      fs.mkdirSync(targetDir, { recursive: true });
      fs.renameSync(oldPath, newPath);

      await (db.doctor as any).update({
        where: { id: doctor.id },
        data: { [dbField]: newRelativePath },
      });

      console.log(`  [OK]   ${doctor.id.slice(0, 8)} ${dbField}: ${oldFilename} → ${newRelativePath}`);
      moved++;
    }
  }

  console.log(`\nDone. ${moved} files moved, ${skipped} skipped.`);
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
