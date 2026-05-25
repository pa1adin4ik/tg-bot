import { botConfig } from '../../config';
import { demoApi } from '../../demo/demo-api';
import { apiGet, apiPost } from './http-client';

export interface BotBookingDateOption {
  date: string;
  label: string;
  availableSlotsCount: number;
}

export interface BotBookingSlotOption {
  startAt: string;
  endAt: string;
  label: string;
}

export interface BotBookingSummary {
  id: string;
  status:
    | 'PENDING'
    | 'AWAITING_PREPAYMENT'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELED'
    | 'NO_SHOW'
    | 'EXPIRED';
  service: {
    id: string;
    name: string;
  };
  master: {
    id: string;
    fullName: string;
  };
  startAt: string;
  endAt: string;
  totalPrice: string;
  currency: string;
  prepaymentAmount: string | null;
  paymentStatus:
    | 'PENDING'
    | 'RESERVED'
    | 'AUTHORIZED'
    | 'CAPTURED'
    | 'FAILED'
    | 'CANCELED'
    | 'REFUNDED'
    | 'EXPIRED'
    | null;
  paymentExpiresAt: string | null;
  reservationExpiresAt: string | null;
  notes: string | null;
}

interface TelegramUserPayload {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
}

export const listBookingDates = async (
  serviceId: string,
  masterId: string,
): Promise<BotBookingDateOption[]> => {
  if (botConfig.demoMode) {
    return demoApi.listBookingDates(serviceId, masterId);
  }

  return apiGet<BotBookingDateOption[]>('/booking-flow/dates', {
    serviceId,
    masterId,
  });
};

export const listBookingSlots = async (
  serviceId: string,
  masterId: string,
  date: string,
): Promise<BotBookingSlotOption[]> => {
  if (botConfig.demoMode) {
    return demoApi.listBookingSlots(serviceId, masterId, date);
  }

  return apiGet<BotBookingSlotOption[]>('/booking-flow/slots', {
    serviceId,
    masterId,
    date,
  });
};

export const createBotBooking = async (payload: {
  telegramUser: TelegramUserPayload;
  serviceId: string;
  masterId: string;
  slotStartAt: string;
  paymentOption: 'AT_VENUE' | 'PREPAY_NOW';
  notes?: string;
}): Promise<BotBookingSummary> => {
  if (botConfig.demoMode) {
    return demoApi.createBooking(payload);
  }

  return apiPost<BotBookingSummary>('/bookings', payload);
};

export type BookingListScope = 'upcoming' | 'completed' | 'cancelled' | 'history' | 'all';

export const listUserBookings = async (
  telegramId: string,
  scope: BookingListScope = 'upcoming',
): Promise<BotBookingSummary[]> => {
  if (botConfig.demoMode) {
    return demoApi.listUserBookings(telegramId, scope);
  }

  return apiGet<BotBookingSummary[]>(`/bookings/by-telegram/${telegramId}`, {
    scope,
  });
};

export const getUserBooking = async (
  bookingId: string,
  telegramId: string,
): Promise<BotBookingSummary> => {
  if (botConfig.demoMode) {
    return demoApi.getBooking(bookingId, telegramId);
  }

  return apiGet<BotBookingSummary>(`/bookings/${bookingId}`, { telegramId });
};

export const cancelUserBooking = async (
  bookingId: string,
  telegramId: string,
  reason?: string,
): Promise<BotBookingSummary> => {
  if (botConfig.demoMode) {
    return demoApi.cancelBooking(bookingId, telegramId, reason);
  }

  return apiPost<BotBookingSummary>(`/bookings/${bookingId}/cancel`, {
    telegramId,
    reason,
  });
};

export const listRescheduleSlots = async (
  bookingId: string,
  telegramId: string,
  date: string,
): Promise<BotBookingSlotOption[]> => {
  if (botConfig.demoMode) {
    return demoApi.listRescheduleSlots(bookingId, telegramId, date);
  }

  return apiGet<BotBookingSlotOption[]>(`/bookings/${bookingId}/reschedule/slots`, {
    telegramId,
    date,
  });
};

export const rescheduleUserBooking = async (
  bookingId: string,
  telegramId: string,
  slotStartAt: string,
): Promise<BotBookingSummary> => {
  if (botConfig.demoMode) {
    return demoApi.rescheduleBooking(bookingId, telegramId, slotStartAt);
  }

  return apiPost<BotBookingSummary>(`/bookings/${bookingId}/reschedule`, {
    telegramId,
    slotStartAt,
  });
};
