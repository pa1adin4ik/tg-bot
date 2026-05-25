import { env } from './env';

export const botConfig = {
  token: env.BOT_TOKEN,
  username: env.BOT_USERNAME,
  backendApiUrl: env.BACKEND_API_URL,
  botApiSecret: env.BOT_API_SECRET,
  demoMode: env.DEMO_MODE,
  mode: env.BOT_MODE,
  port: env.PORT,
  webhookBaseUrl: env.WEBHOOK_BASE_URL,
  webhookSecret: env.WEBHOOK_SECRET,
  webhookPath: `/telegram/webhook/${env.WEBHOOK_SECRET}`,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
} as const;
