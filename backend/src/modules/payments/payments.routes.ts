import { Router } from 'express';
import { z } from 'zod';

import { requireBotApiSecret, validate } from '../../common/middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { authorize } from '../auth';
import { paymentsController } from './payments.controller';

export const paymentsRouter = Router();

paymentsRouter.post(
  '/payments/:paymentId/initiate',
  requireBotApiSecret,
  validate({
    params: z.object({ paymentId: z.string().uuid() }),
    body: z.object({ telegramId: z.string().min(1) }),
  }),
  paymentsController.initiate,
);

paymentsRouter.post(
  '/payments/:paymentId/confirm',
  requireBotApiSecret,
  validate({
    params: z.object({ paymentId: z.string().uuid() }),
    body: z.object({ telegramId: z.string().min(1) }),
  }),
  paymentsController.confirm,
);

paymentsRouter.post(
  '/payments/:paymentId/fail',
  requireBotApiSecret,
  validate({
    params: z.object({ paymentId: z.string().uuid() }),
    body: z.object({ telegramId: z.string().min(1) }),
  }),
  paymentsController.fail,
);

paymentsRouter.get(
  '/bookings/:bookingId/payment',
  requireBotApiSecret,
  validate({
    params: z.object({ bookingId: z.string().uuid() }),
    query: z.object({ telegramId: z.string().min(1) }),
  }),
  paymentsController.getByBooking,
);

paymentsRouter.get(
  '/admin/payments',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  paymentsController.listAdmin,
);
