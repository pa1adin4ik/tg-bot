import { env } from './env';

export const paymentConfig = {
  mockProviderEnabled: env.PAYMENT_MOCK_PROVIDER_ENABLED,
  retryCooldownSeconds: env.PAYMENT_RETRY_COOLDOWN_SECONDS,
} as const;
