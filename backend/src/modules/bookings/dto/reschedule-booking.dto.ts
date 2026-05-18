import { z } from 'zod';

export const rescheduleSlotsQuerySchema = z.object({
  date: z.string().date(),
  telegramId: z.string().trim().min(1).max(64),
});

export const rescheduleBookingBodySchema = z.object({
  telegramId: z.string().trim().min(1).max(64),
  slotStartAt: z.string().datetime(),
});

export type RescheduleSlotsQueryDto = z.infer<typeof rescheduleSlotsQuerySchema>;
export type RescheduleBookingBodyDto = z.infer<typeof rescheduleBookingBodySchema>;
