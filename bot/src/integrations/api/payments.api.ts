import { apiGet, apiPost } from './http-client';

export interface BotPaymentSummary {
  id: string;
  bookingId: string;
  status: string;
  amount: string;
  currency: string;
  checkoutUrl: string | null;
  expiresAt: string | null;
}

export const getBookingPayment = async (
  bookingId: string,
  telegramId: string,
): Promise<BotPaymentSummary | null> => {
  return apiGet<BotPaymentSummary | null>(`/bookings/${bookingId}/payment`, { telegramId });
};

export const initiatePayment = async (
  paymentId: string,
  telegramId: string,
): Promise<BotPaymentSummary> => {
  return apiPost<BotPaymentSummary>(`/payments/${paymentId}/initiate`, { telegramId });
};

export const confirmPayment = async (
  paymentId: string,
  telegramId: string,
): Promise<BotPaymentSummary> => {
  return apiPost<BotPaymentSummary>(`/payments/${paymentId}/confirm`, { telegramId });
};
