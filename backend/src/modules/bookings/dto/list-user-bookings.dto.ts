import { z } from 'zod';

import { BOOKING_LIST_SCOPES } from '../bookings.constants';

export const listUserBookingsQuerySchema = z.object({
  scope: z.enum(BOOKING_LIST_SCOPES).default('upcoming'),
});

export type ListUserBookingsQueryDto = z.infer<typeof listUserBookingsQuerySchema>;
