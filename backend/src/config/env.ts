import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_PREFIX: z.string().min(1).default('/api/v1'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:5432/debug_bot_tgh'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CORS_ORIGIN: z.string().default('*'),
  TRUST_PROXY: z.string().default('false'),
  BODY_SIZE_LIMIT: z.string().default('1mb'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-16chars!!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-16chars!!'),
  JWT_ACCESS_TTL: z.string().min(2).default('15m'),
  JWT_REFRESH_TTL: z.string().min(2).default('7d'),
  AUTH_BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  BOOKING_RESERVATION_MINUTES: z.coerce.number().int().min(5).max(120).default(15),
  BOOKING_SEARCH_DAYS: z.coerce.number().int().min(1).max(60).default(14),
  BOOKING_SLOT_INTERVAL_MINUTES: z.coerce.number().int().min(5).max(120).default(15),
  BOT_API_SECRET: z.string().min(16).default('dev-bot-api-secret-16chars'),
  MAX_ACTIVE_RESERVATIONS_PER_USER: z.coerce.number().int().min(1).max(10).default(2),
  PAYMENT_MOCK_PROVIDER_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value === 'true' || value === '1'),
  PAYMENT_RETRY_COOLDOWN_SECONDS: z.coerce.number().int().min(0).max(600).default(60),
  WORKER_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value === 'true' || value === '1'),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
