import path from 'path';

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const botToken = process.env.BOT_TOKEN?.trim();

if (!botToken) {
  console.error('BOT_TOKEN is not defined');
  process.exit(1);
}

const demoMode = process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1';
const webhookBaseUrl = process.env.WEBHOOK_BASE_URL?.trim();

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BOT_USERNAME: z.string().min(1).default('demo_booking_bot'),
  BACKEND_API_URL: demoMode ? z.string().url().optional() : z.string().url(),
  BOT_API_SECRET: z.string().min(16).default('dev-bot-api-secret-16chars'),
  DEMO_MODE: z
    .string()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  BOT_MODE: z.enum(['polling', 'webhook']).default(webhookBaseUrl ? 'webhook' : 'polling'),
  WEBHOOK_BASE_URL: z.string().url().optional(),
  WEBHOOK_SECRET: z.string().min(16).default('dev-bot-webhook-secret-16chars'),
  PORT: z.coerce.number().int().min(1).max(65535).default(10000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

const parsedEnv = envSchema.safeParse({
  ...process.env,
  BOT_TOKEN: botToken,
  DEMO_MODE: process.env.DEMO_MODE ?? 'false',
});

if (!parsedEnv.success) {
  console.error('Invalid bot environment variables', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
