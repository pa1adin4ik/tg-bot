import { z } from 'zod';

export const cancelBookingBodySchema = z.object({
  telegramId: z.string().trim().min(1).max(64),
  reason: z.string().trim().max(500).optional(),
});

export type CancelBookingBodyDto = z.infer<typeof cancelBookingBodySchema>;
