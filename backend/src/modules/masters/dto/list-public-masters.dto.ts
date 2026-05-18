import { z } from 'zod';

export const listPublicMastersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  serviceSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export type ListPublicMastersQueryDto = z.infer<typeof listPublicMastersQuerySchema>;
