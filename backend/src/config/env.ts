import dotenv from 'dotenv';
dotenv.config();

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: requiredEnv('JWT_SECRET') || 'fallback-secret',
    refreshSecret: requiredEnv('JWT_REFRESH_SECRET') || 'fallback-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  db: {
    url: process.env.DATABASE_URL || '',
  },
  platform: {
    companyName: process.env.PLATFORM_COMPANY_NAME || 'Prescribe Pro',
    address: process.env.PLATFORM_ADDRESS || '',
    phone: process.env.PLATFORM_PHONE || '',
  },
  backup: {
    dir: process.env.BACKUP_DIR || './backups',
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    apiMax: Number(process.env.API_RATE_LIMIT_MAX) || 200,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 100,
  },
} as const;
