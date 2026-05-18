import { Router } from 'express';
import { z } from 'zod';

import { validate } from '../../common/middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { authorize } from '../auth';
import { portfolioService } from './portfolio.service';

const upsertWorkSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  caption: z.string().max(500).optional(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  categoryId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export const portfolioRouter = Router();

portfolioRouter.get(
  '/masters/:masterId/portfolio',
  asyncHandler(async (request, response) => {
    const masterId = (request.params as { masterId: string }).masterId;
    const featuredOnly = request.query.featured === 'true';
    const data = await portfolioService.listPublicByMaster(masterId, featuredOnly);
    response.status(200).json({ success: true, data });
  }),
);

portfolioRouter.get(
  '/portfolio/categories',
  asyncHandler(async (_request, response) => {
    const data = await portfolioService.listCategories();
    response.status(200).json({ success: true, data });
  }),
);

portfolioRouter.post(
  '/admin/masters/:masterId/portfolio',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({
    params: z.object({ masterId: z.string().uuid() }),
    body: upsertWorkSchema,
  }),
  asyncHandler(async (request, response) => {
    const { masterId } = request.params as { masterId: string };
    const body = request.body as z.infer<typeof upsertWorkSchema>;
    const data = await portfolioService.upsertWork(masterId, body);
    response.status(201).json({ success: true, data });
  }),
);

portfolioRouter.delete(
  '/admin/portfolio/:workId',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ params: z.object({ workId: z.string().uuid() }) }),
  asyncHandler(async (request, response) => {
    const { workId } = request.params as { workId: string };
    await portfolioService.deleteWork(workId);
    response.status(204).send();
  }),
);
