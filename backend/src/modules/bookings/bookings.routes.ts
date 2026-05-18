import { Router } from 'express';

import { requireBotApiSecret, validate } from '../../common/middleware';
import { authorize } from '../auth';
import { bookingsController } from './bookings.controller';
import {
  bookingIdParamSchema,
  cancelBookingBodySchema,
  createBookingBodySchema,
  listBookingDatesQuerySchema,
  listBookingSlotsQuerySchema,
  listUserBookingsQuerySchema,
  rescheduleBookingBodySchema,
  rescheduleSlotsQuerySchema,
  bookingTelegramQuerySchema,
  telegramIdParamSchema,
} from './dto';

export const bookingsRouter = Router();

const botAuth = requireBotApiSecret;

bookingsRouter.get(
  '/booking-flow/dates',
  botAuth,
  validate({ query: listBookingDatesQuerySchema }),
  bookingsController.listDates,
);
bookingsRouter.get(
  '/booking-flow/slots',
  botAuth,
  validate({ query: listBookingSlotsQuerySchema }),
  bookingsController.listSlots,
);
bookingsRouter.post(
  '/bookings',
  botAuth,
  validate({ body: createBookingBodySchema }),
  bookingsController.create,
);
bookingsRouter.get(
  '/bookings/by-telegram/:telegramId',
  botAuth,
  validate({ params: telegramIdParamSchema, query: listUserBookingsQuerySchema }),
  bookingsController.listUserBookings,
);
bookingsRouter.get(
  '/bookings/:bookingId',
  botAuth,
  validate({ params: bookingIdParamSchema, query: bookingTelegramQuerySchema }),
  bookingsController.getById,
);

bookingsRouter.post(
  '/bookings/:bookingId/cancel',
  botAuth,
  validate({ params: bookingIdParamSchema, body: cancelBookingBodySchema }),
  bookingsController.cancel,
);
bookingsRouter.get(
  '/bookings/:bookingId/reschedule/slots',
  botAuth,
  validate({ params: bookingIdParamSchema, query: rescheduleSlotsQuerySchema }),
  bookingsController.listRescheduleSlots,
);
bookingsRouter.post(
  '/bookings/:bookingId/reschedule',
  botAuth,
  validate({ params: bookingIdParamSchema, body: rescheduleBookingBodySchema }),
  bookingsController.reschedule,
);

bookingsRouter.get(
  '/admin/bookings',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  bookingsController.listAdmin,
);
bookingsRouter.patch(
  '/admin/bookings/:bookingId/status',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  bookingsController.updateAdminStatus,
);
bookingsRouter.post(
  '/admin/bookings/:bookingId/cancel',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  bookingsController.adminCancel,
);
