import { z } from 'zod';

export const telegramUserSchema = z.object({
  telegramId: z.string().trim().min(1).max(64),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  username: z.string().trim().max(100).optional(),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().uuid(),
});

export const telegramIdParamSchema = z.object({
  telegramId: z.string().trim().min(1).max(64),
});

export const bookingTelegramQuerySchema = z.object({
  telegramId: z.string().trim().min(1).max(64),
});
