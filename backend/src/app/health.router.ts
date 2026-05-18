import { Router } from 'express';

import { asyncHandler } from '../common/utils/async-handler';
import { checkPrismaHealth } from '../database';

export const healthRouter = Router();

healthRouter.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get(
  '/ready',
  asyncHandler(async (_request, response) => {
    await checkPrismaHealth();

    response.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  }),
);
