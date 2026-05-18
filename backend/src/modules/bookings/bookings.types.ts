import type { BookingStatus, CurrencyCode, PaymentStatus } from '@prisma/client';

import type { BookingListScope, BookingPaymentOption } from './bookings.constants';

export interface TelegramUserInput {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
}

export interface BookingDatesQuery {
  serviceId: string;
  masterId: string;
}

export interface BookingSlotsQuery extends BookingDatesQuery {
  date: string;
}

export interface CreateBookingInput {
  telegramUser: TelegramUserInput;
  serviceId: string;
  masterId: string;
  slotStartAt: string;
  paymentOption: BookingPaymentOption;
  notes?: string;
}

export interface ListUserBookingsQuery {
  scope: BookingListScope;
}

export interface ListUserBookingsParams {
  telegramId: string;
}

export interface BookingIdParams {
  bookingId: string;
}

export interface CancelBookingInput {
  telegramId: string;
  reason?: string;
}

export interface RescheduleSlotsQuery {
  date: string;
}

export interface RescheduleBookingInput {
  telegramId: string;
  slotStartAt: string;
}

export interface BookingDateOption {
  date: string;
  label: string;
  availableSlotsCount: number;
}

export interface BookingSlotOption {
  startAt: string;
  endAt: string;
  label: string;
}

export interface BookingSummaryResponse {
  id: string;
  status: BookingStatus;
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
  currency: CurrencyCode;
  prepaymentAmount: string | null;
  paymentStatus: PaymentStatus | null;
  paymentExpiresAt: string | null;
  reservationExpiresAt: string | null;
  notes: string | null;
}
