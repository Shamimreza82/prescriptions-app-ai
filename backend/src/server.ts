import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { db } from './config/database';
import * as Sentry from '@sentry/node';

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT_EXCEPTION', { err });
  Sentry.captureException(err, { tags: { process: 'uncaughtException' } });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED_REJECTION', { err: reason });
  Sentry.captureException(reason, { tags: { process: 'unhandledRejection' } });
});

const server = app.listen(env.port, () => {
  logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    logger.info('HTTP server closed');
    await db.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
