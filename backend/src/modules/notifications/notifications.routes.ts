import { Router } from 'express';

import { asyncHandler } from '../../common/utils/async-handler';
import { authorize } from '../auth';
import { notificationsService } from './notifications.service';

export const notificationsRouter = Router();

notificationsRouter.post(
  '/admin/notifications/process',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (_request, response) => {
    const processed = await notificationsService.processPendingBatch();
    response.status(200).json({ success: true, data: { processed } });
  }),
);
