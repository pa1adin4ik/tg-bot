import { createApp } from './app';
import { appConfig, env, logger } from './config';
import { connectPrisma, disconnectPrisma } from './database';
import { startWorkers } from './workers';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const bootstrap = async (): Promise<void> => {
  await connectPrisma();

  const app = createApp();
  const server = app.listen(appConfig.port, appConfig.host, () => {
    if (env.EMBEDDED_WORKERS_ENABLED) {
      startWorkers();
    } else {
      logger.info('Embedded background workers are disabled for the API process');
    }

    logger.info(
      {
        host: appConfig.host,
        port: appConfig.port,
        env: appConfig.nodeEnv,
      },
      'Backend server started',
    );
  });

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, 'Shutdown signal received');

    const forceCloseTimer = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    forceCloseTimer.unref();

    server.close(async (error) => {
      if (error) {
        logger.error({ error }, 'Failed to close HTTP server cleanly');
        process.exitCode = 1;
      }

      try {
        await disconnectPrisma();
      } finally {
        clearTimeout(forceCloseTimer);
        process.exit();
      }
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    void shutdown('UNCAUGHT_EXCEPTION');
  });
};

void bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to bootstrap backend');
  process.exit(1);
});
