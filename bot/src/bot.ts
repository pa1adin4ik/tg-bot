import { createServer } from 'node:http';

import { createBot } from './app/create-bot';
import { botConfig, logger } from './config';

const bootstrap = async (): Promise<void> => {
  const bot = createBot();

  if (botConfig.demoMode) {
    logger.warn('Telegram bot is running in demo mode with local sample data');
  }

  if (botConfig.mode === 'webhook') {
    if (!botConfig.webhookBaseUrl) {
      throw new Error('WEBHOOK_BASE_URL is required when BOT_MODE=webhook');
    }

    await bot.telegram.setWebhook(`${botConfig.webhookBaseUrl}${botConfig.webhookPath}`);

    const webhookCallback = bot.webhookCallback(botConfig.webhookPath);
    const server = createServer((request, response) => {
      if (request.method === 'GET' && request.url === '/health') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok', mode: 'webhook' }));
        return;
      }

      if (request.url === botConfig.webhookPath) {
        void webhookCallback(request, response);
        return;
      }

      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ status: 'not_found' }));
    });

    await new Promise<void>((resolve) => {
      server.listen(botConfig.port, '0.0.0.0', () => resolve());
    });

    logger.info(
      {
        username: botConfig.username,
        port: botConfig.port,
        webhookPath: botConfig.webhookPath,
      },
      'Telegram bot started in webhook mode',
    );

    const shutdown = (signal: string): void => {
      logger.info({ signal }, 'Stopping Telegram bot');
      server.close();
      bot.stop(signal);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    return;
  }

  if (botConfig.isProduction) {
    logger.warn(
      'Telegram bot is running with long polling and in-memory sessions. Deploy a single replica only.',
    );
  }

  await bot.launch();
  const server = createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ status: 'ok', mode: 'polling' }));
      return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: 'not_found' }));
  });

  await new Promise<void>((resolve) => {
    server.listen(botConfig.port, '0.0.0.0', () => resolve());
  });

  logger.info({ username: botConfig.username, port: botConfig.port }, 'Telegram bot started');

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Stopping Telegram bot');
    server.close();
    bot.stop(signal);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

void bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to start Telegram bot');
  process.exit(1);
});
