import { env } from './env';

export const bookingConfig = {
  reservationMinutes: env.BOOKING_RESERVATION_MINUTES,
  searchDays: env.BOOKING_SEARCH_DAYS,
  slotIntervalMinutes: env.BOOKING_SLOT_INTERVAL_MINUTES,
} as const;
