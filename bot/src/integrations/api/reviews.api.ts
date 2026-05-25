import { botConfig } from '../../config';
import { demoApi } from '../../demo/demo-api';
import { apiPost } from './http-client';

export const createReview = async (payload: {
  bookingId: string;
  telegramId: string;
  rating: number;
  comment?: string;
}): Promise<void> => {
  if (botConfig.demoMode) {
    await demoApi.createReview(payload);
    return;
  }

  await apiPost(`/bookings/${payload.bookingId}/reviews`, {
    telegramId: payload.telegramId,
    rating: payload.rating,
    comment: payload.comment,
  });
};
