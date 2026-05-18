import { env } from './env';

export const securityConfig = {
  botApiSecret: env.BOT_API_SECRET,
  maxActiveReservationsPerUser: env.MAX_ACTIVE_RESERVATIONS_PER_USER,
} as const;
