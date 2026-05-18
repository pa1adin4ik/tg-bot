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

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BOT_USERNAME: z.string().min(1),
  BACKEND_API_URL: z.string().url(),
  BOT_API_SECRET: z.string().min(16).default('dev-bot-api-secret-16chars'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

const parsedEnv = envSchema.safeParse({
  ...process.env,
  BOT_TOKEN: botToken,
});

if (!parsedEnv.success) {
  console.error('Invalid bot environment variables', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
