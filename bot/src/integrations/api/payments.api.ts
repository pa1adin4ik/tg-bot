import { botConfig } from '../../config';
import { demoApi } from '../../demo/demo-api';
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
  if (botConfig.demoMode) {
    return demoApi.getBookingPayment(bookingId, telegramId);
  }

  return apiGet<BotPaymentSummary | null>(`/bookings/${bookingId}/payment`, { telegramId });
};

export const initiatePayment = async (
  paymentId: string,
  telegramId: string,
): Promise<BotPaymentSummary> => {
  if (botConfig.demoMode) {
    return demoApi.initiatePayment(paymentId, telegramId);
  }

  return apiPost<BotPaymentSummary>(`/payments/${paymentId}/initiate`, { telegramId });
};

export const confirmPayment = async (
  paymentId: string,
  telegramId: string,
): Promise<BotPaymentSummary> => {
  if (botConfig.demoMode) {
    return demoApi.confirmPayment(paymentId, telegramId);
  }

  return apiPost<BotPaymentSummary>(`/payments/${paymentId}/confirm`, { telegramId });
};
