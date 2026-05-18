import { z } from 'zod';

import { MASTER_VISIBILITY_FILTERS } from '../masters.constants';

export const listAdminMastersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  visibility: z.enum(MASTER_VISIBILITY_FILTERS).default('all'),
});

export type ListAdminMastersQueryDto = z.infer<typeof listAdminMastersQuerySchema>;
