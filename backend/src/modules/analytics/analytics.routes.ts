import { Router } from 'express';
import { z } from 'zod';

import { validate } from '../../common/middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { authorize } from '../auth';
import { analyticsService } from './analytics.service';

const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const analyticsRouter = Router();

analyticsRouter.get(
  '/admin/analytics/dashboard',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ query: rangeSchema }),
  asyncHandler(async (request, response) => {
    const query = request.query as z.infer<typeof rangeSchema>;
    const data = await analyticsService.getDashboard({
      from: new Date(query.from),
      to: new Date(query.to),
    });
    response.status(200).json({ success: true, data });
  }),
);

analyticsRouter.get(
  '/admin/analytics/bookings-trend',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ query: rangeSchema }),
  asyncHandler(async (request, response) => {
    const query = request.query as z.infer<typeof rangeSchema>;
    const data = await analyticsService.getBookingsTrend({
      from: new Date(query.from),
      to: new Date(query.to),
    });
    response.status(200).json({ success: true, data });
  }),
);
