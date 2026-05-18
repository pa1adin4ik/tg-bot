import { z } from 'zod';

import { SERVICE_STATUS_FILTERS } from '../services.constants';

export const listServiceCategoriesQuerySchema = z.object({
  status: z.enum(SERVICE_STATUS_FILTERS).default('active'),
  includeEmpty: z.coerce.boolean().default(false),
});

export type ListServiceCategoriesQueryDto = z.infer<typeof listServiceCategoriesQuerySchema>;
