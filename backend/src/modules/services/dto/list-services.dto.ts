import { z } from 'zod';

import { SERVICE_STATUS_FILTERS } from '../services.constants';

export const listServicesQuerySchema = z.object({
  status: z.enum(SERVICE_STATUS_FILTERS).default('active'),
  categorySlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export type ListServicesQueryDto = z.infer<typeof listServicesQuerySchema>;
