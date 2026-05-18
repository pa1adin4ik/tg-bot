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
  return apiPost<BotBookingSummary>('/bookings', payload);
};

export type BookingListScope = 'upcoming' | 'completed' | 'cancelled' | 'history' | 'all';

export const listUserBookings = async (
  telegramId: string,
  scope: BookingListScope = 'upcoming',
): Promise<BotBookingSummary[]> => {
  return apiGet<BotBookingSummary[]>(`/bookings/by-telegram/${telegramId}`, {
    scope,
  });
};

export const getUserBooking = async (
  bookingId: string,
  telegramId: string,
): Promise<BotBookingSummary> => {
  return apiGet<BotBookingSummary>(`/bookings/${bookingId}`, { telegramId });
};

export const cancelUserBooking = async (
  bookingId: string,
  telegramId: string,
  reason?: string,
): Promise<BotBookingSummary> => {
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
  return apiPost<BotBookingSummary>(`/bookings/${bookingId}/reschedule`, {
    telegramId,
    slotStartAt,
  });
};
