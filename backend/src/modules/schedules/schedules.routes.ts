import { Router } from 'express';
import { z } from 'zod';

import { validate } from '../../common/middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { authorize } from '../auth';
import { schedulesService } from './schedules.service';

const scheduleItemSchema = z.object({
  type: z.enum(['WORKING_HOURS', 'BLOCKED_TIME']),
  dayOfWeek: z
    .enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
    .optional()
    .nullable(),
  specificDate: z.string().optional().nullable(),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(1440),
  timezone: z.string().min(1).max(64),
  isRecurring: z.boolean(),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
});

const masterParamSchema = z.object({
  masterId: z.string().uuid(),
});

const replaceSchedulesSchema = z.object({
  schedules: z.array(scheduleItemSchema),
});

export const schedulesRouter = Router();

schedulesRouter.get(
  '/admin/masters/:masterId/schedules',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ params: masterParamSchema }),
  asyncHandler(async (request, response) => {
    const { masterId } = request.params as z.infer<typeof masterParamSchema>;
    const data = await schedulesService.listByMaster(masterId);
    response.status(200).json({ success: true, data });
  }),
);

schedulesRouter.put(
  '/admin/masters/:masterId/schedules',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ params: masterParamSchema, body: replaceSchedulesSchema }),
  asyncHandler(async (request, response) => {
    const { masterId } = request.params as z.infer<typeof masterParamSchema>;
    const { schedules } = request.body as z.infer<typeof replaceSchedulesSchema>;
    const data = await schedulesService.replaceForMaster(masterId, schedules);
    response.status(200).json({ success: true, data });
  }),
);
