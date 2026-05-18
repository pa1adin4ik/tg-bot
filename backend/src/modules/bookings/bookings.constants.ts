export const ACTIVE_BOOKING_STATUSES = [
  'PENDING',
  'AWAITING_PREPAYMENT',
  'CONFIRMED',
  'IN_PROGRESS',
] as const;

export const CANCELABLE_BOOKING_STATUSES = ['AWAITING_PREPAYMENT', 'CONFIRMED'] as const;

export const RESCHEDULABLE_BOOKING_STATUSES = ['AWAITING_PREPAYMENT', 'CONFIRMED'] as const;

export const BOOKING_LIST_SCOPES = ['upcoming', 'completed', 'cancelled', 'history', 'all'] as const;

export const BOOKING_PAYMENT_OPTIONS = ['AT_VENUE', 'PREPAY_NOW'] as const;

export type BookingListScope = (typeof BOOKING_LIST_SCOPES)[number];
export type BookingPaymentOption = (typeof BOOKING_PAYMENT_OPTIONS)[number];
