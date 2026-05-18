import { z } from 'zod';

export const loginDtoSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export type LoginDto = z.infer<typeof loginDtoSchema>;
