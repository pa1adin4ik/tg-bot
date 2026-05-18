import { BookingStatus, ReviewStatus } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import { prisma } from '../../database';

export interface ReviewResponse {
  id: string;
  bookingId: string;
  masterId: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export class ReviewsService {
  public async createReview(input: {
    bookingId: string;
    telegramId: string;
    rating: number;
    comment?: string;
  }): Promise<ReviewResponse> {
    if (input.rating < 1 || input.rating > 5) {
      throw new AppError(400, 'INVALID_RATING', 'Rating must be between 1 and 5');
    }

    if (input.comment && input.comment.trim().length < 3) {
      throw new AppError(400, 'INVALID_COMMENT', 'Comment is too short');
    }

    const user = await prisma.user.findFirst({
      where: { telegramId: input.telegramId, deletedAt: null },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User was not found');
    }

    const booking = await prisma.booking.findFirst({
      where: { id: input.bookingId, userId: user.id },
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new AppError(400, 'BOOKING_NOT_REVIEWABLE', 'Only completed bookings can be reviewed');
    }

    const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
    if (existing) {
      throw new AppError(409, 'REVIEW_EXISTS', 'This booking already has a review');
    }

    const recentCount = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentCount >= 3) {
      throw new AppError(429, 'REVIEW_RATE_LIMIT', 'Too many reviews submitted today');
    }

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        userId: user.id,
        masterId: booking.masterId,
        rating: input.rating,
        comment: input.comment?.trim() || null,
        status: ReviewStatus.PENDING_MODERATION,
      },
    });

    return this.mapReview(review);
  }

  public async moderateReview(
    reviewId: string,
    input: { status: 'PUBLISHED' | 'HIDDEN'; adminId: string; rejectReason?: string },
  ): Promise<ReviewResponse> {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });

    if (!review) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review was not found');
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        status: input.status === 'PUBLISHED' ? ReviewStatus.PUBLISHED : ReviewStatus.HIDDEN,
        moderatedAt: new Date(),
        moderatedByAdminId: input.adminId,
        rejectReason: input.rejectReason ?? null,
      },
    });

    if (input.status === 'PUBLISHED') {
      await this.syncMasterRating(review.masterId);
    }

    return this.mapReview(updated);
  }

  public async listPublicByMaster(masterId: string): Promise<ReviewResponse[]> {
    const reviews = await prisma.review.findMany({
      where: { masterId, status: ReviewStatus.PUBLISHED, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reviews.map((review) => this.mapReview(review));
  }

  public async listAdmin(query: { status?: ReviewStatus; page: number; limit: number }) {
    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: query.limit }),
      prisma.review.count({ where }),
    ]);

    return { items: items.map((review) => this.mapReview(review)), total };
  }

  private async syncMasterRating(masterId: string): Promise<void> {
    const aggregate = await prisma.review.aggregate({
      where: { masterId, status: ReviewStatus.PUBLISHED, deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.master.update({
      where: { id: masterId },
      data: {
        ratingAvg: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
  }

  private mapReview(review: {
    id: string;
    bookingId: string;
    masterId: string;
    rating: number;
    comment: string | null;
    status: ReviewStatus;
    createdAt: Date;
  }): ReviewResponse {
    return {
      id: review.id,
      bookingId: review.bookingId,
      masterId: review.masterId,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
    };
  }
}

export const reviewsService = new ReviewsService();
