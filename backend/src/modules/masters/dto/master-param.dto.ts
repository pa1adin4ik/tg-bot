import { z } from 'zod';

export const masterParamSchema = z.object({
  masterId: z.string().uuid(),
});

export type MasterParamDto = z.infer<typeof masterParamSchema>;
