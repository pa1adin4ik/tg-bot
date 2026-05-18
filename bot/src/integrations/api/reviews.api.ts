import { apiPost } from './http-client';

export const createReview = async (payload: {
  bookingId: string;
  telegramId: string;
  rating: number;
  comment?: string;
}): Promise<void> => {
  await apiPost(`/bookings/${payload.bookingId}/reviews`, {
    telegramId: payload.telegramId,
    rating: payload.rating,
    comment: payload.comment,
  });
};
