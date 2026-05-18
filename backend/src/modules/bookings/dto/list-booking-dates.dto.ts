import { z } from 'zod';

export const listBookingDatesQuerySchema = z.object({
  serviceId: z.string().uuid(),
  masterId: z.string().uuid(),
});

export type ListBookingDatesQueryDto = z.infer<typeof listBookingDatesQuerySchema>;
