import { env, logger } from '../config';
import { connectPrisma, disconnectPrisma } from '../database';
import { startWorkers } from './index';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const bootstrap = async (): Promise<void> => {
  await connectPrisma();

  if (!env.WORKER_ENABLED) {
    logger.warn('Worker process started with WORKER_ENABLED=false, exiting');
    await disconnectPrisma();
    return;
  }

  startWorkers();
  logger.info('Background worker process started');

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, 'Stopping background worker process');

    const forceCloseTimer = setTimeout(() => {
      logger.error('Forced worker shutdown due to timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    forceCloseTimer.unref();

    try {
      await disconnectPrisma();
      clearTimeout(forceCloseTimer);
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Failed to stop background worker process cleanly');
      clearTimeout(forceCloseTimer);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection in worker process');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception in worker process');
    void shutdown('UNCAUGHT_EXCEPTION');
  });
};

void bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to bootstrap background worker process');
  process.exit(1);
});
