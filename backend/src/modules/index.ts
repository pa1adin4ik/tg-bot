import { Router } from 'express';

import { analyticsRouter } from './analytics';
import { authRouter } from './auth';
import { bookingsRouter } from './bookings';
import { mastersRouter } from './masters';
import { notificationsRouter } from './notifications';
import { paymentsRouter } from './payments';
import { portfolioRouter } from './portfolio';
import { reviewsRouter } from './reviews';
import { schedulesRouter } from './schedules';
import { servicesRouter } from './services';

export const createModulesRouter = (): Router => {
  const router = Router();

  router.use('/auth', authRouter);
  router.use(bookingsRouter);
  router.use(paymentsRouter);
  router.use(mastersRouter);
  router.use(servicesRouter);
  router.use(schedulesRouter);
  router.use(reviewsRouter);
  router.use(portfolioRouter);
  router.use(notificationsRouter);
  router.use(analyticsRouter);

  return router;
};
