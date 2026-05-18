import { z } from 'zod';

export const listBookingSlotsQuerySchema = z.object({
  serviceId: z.string().uuid(),
  masterId: z.string().uuid(),
  date: z.string().date(),
});

export type ListBookingSlotsQueryDto = z.infer<typeof listBookingSlotsQuerySchema>;
