import { createBot } from './app/create-bot';
import { botConfig, logger } from './config';

const bootstrap = async (): Promise<void> => {
  const bot = createBot();

  await bot.launch();
  logger.info({ username: botConfig.username }, 'Telegram bot started');

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Stopping Telegram bot');
    bot.stop(signal);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

void bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to start Telegram bot');
  process.exit(1);
});
