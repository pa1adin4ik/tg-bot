import { z } from 'zod';

export const refreshTokenDtoSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenDtoSchema>;
