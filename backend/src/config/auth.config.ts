import { env } from './env';

export const authConfig = {
  accessTokenSecret: env.JWT_ACCESS_SECRET,
  refreshTokenSecret: env.JWT_REFRESH_SECRET,
  accessTokenTtl: env.JWT_ACCESS_TTL,
  refreshTokenTtl: env.JWT_REFRESH_TTL,
  bcryptRounds: env.AUTH_BCRYPT_ROUNDS,
} as const;
