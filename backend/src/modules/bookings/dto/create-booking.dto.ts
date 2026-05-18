import { z } from 'zod';

import { BOOKING_PAYMENT_OPTIONS } from '../bookings.constants';
import { telegramUserSchema } from './shared.dto';

export const createBookingBodySchema = z.object({
  telegramUser: telegramUserSchema,
  serviceId: z.string().uuid(),
  masterId: z.string().uuid(),
  slotStartAt: z.string().datetime(),
  paymentOption: z.enum(BOOKING_PAYMENT_OPTIONS),
  notes: z.string().trim().max(500).optional(),
});

export type CreateBookingBodyDto = z.infer<typeof createBookingBodySchema>;
