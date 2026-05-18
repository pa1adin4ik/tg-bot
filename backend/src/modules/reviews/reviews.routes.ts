import { Router } from 'express';
import { z } from 'zod';

import { requireBotApiSecret, validate } from '../../common/middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { authorize } from '../auth';
import { reviewsService } from './reviews.service';

const createReviewSchema = z.object({
  telegramId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

const moderateSchema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN']),
  rejectReason: z.string().optional(),
});

export const reviewsRouter = Router();

reviewsRouter.get(
  '/masters/:masterId/reviews',
  asyncHandler(async (request, response) => {
    const masterId = (request.params as { masterId: string }).masterId;
    const data = await reviewsService.listPublicByMaster(masterId);
    response.status(200).json({ success: true, data });
  }),
);

reviewsRouter.post(
  '/bookings/:bookingId/reviews',
  requireBotApiSecret,
  validate({
    params: z.object({ bookingId: z.string().uuid() }),
    body: createReviewSchema,
  }),
  asyncHandler(async (request, response) => {
    const { bookingId } = request.params as { bookingId: string };
    const body = request.body as z.infer<typeof createReviewSchema>;
    const data = await reviewsService.createReview({
      bookingId,
      telegramId: body.telegramId,
      rating: body.rating,
      comment: body.comment,
    });
    response.status(201).json({ success: true, data });
  }),
);

reviewsRouter.get(
  '/admin/reviews',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  asyncHandler(async (request, response) => {
    const query = request.query as { status?: 'PENDING_MODERATION' | 'PUBLISHED' | 'HIDDEN'; page?: string; limit?: string };
    const data = await reviewsService.listAdmin({
      status: query.status,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    });
    response.status(200).json({ success: true, data });
  }),
);

reviewsRouter.patch(
  '/admin/reviews/:reviewId/moderate',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({
    params: z.object({ reviewId: z.string().uuid() }),
    body: moderateSchema,
  }),
  asyncHandler(async (request, response) => {
    const { reviewId } = request.params as { reviewId: string };
    const body = request.body as z.infer<typeof moderateSchema>;
    const adminId = request.auth!.adminId;
    const data = await reviewsService.moderateReview(reviewId, {
      status: body.status,
      adminId,
      rejectReason: body.rejectReason,
    });
    response.status(200).json({ success: true, data });
  }),
);
