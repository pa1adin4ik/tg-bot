import { Markup } from 'telegraf';

import { createMainMenuButton } from './button-builders';
import { buildInlineKeyboard } from './inline-keyboard.builder';

const encodeValue = (value: string): string => encodeURIComponent(value);

export const buildBookingServicesKeyboard = (
  services: Array<{ id: string; name: string }>,
) => {
  return buildInlineKeyboard([
    ...services.map((service) => [Markup.button.callback(service.name, `booking:service:${service.id}`)]),
    [Markup.button.callback('Cancel', 'booking:cancel-flow'), createMainMenuButton()],
  ]);
};

export const buildBookingMastersKeyboard = (
  masters: Array<{ id: string; fullName: string }>,
) => {
  return buildInlineKeyboard([
    ...masters.map((master) => [Markup.button.callback(master.fullName, `booking:master:${master.id}`)]),
    [
      Markup.button.callback('Back', 'booking:back:services'),
      Markup.button.callback('Cancel', 'booking:cancel-flow'),
    ],
  ]);
};

export const buildBookingDatesKeyboard = (
  dates: Array<{ date: string; label: string; availableSlotsCount: number }>,
  options: { reschedule?: boolean } = {},
) => {
  const prefix = options.reschedule ? 'booking:resdate:' : 'booking:date:';

  return buildInlineKeyboard([
    ...dates.map((dateOption) => [
      Markup.button.callback(
        `${dateOption.label} (${dateOption.availableSlotsCount})`,
        `${prefix}${dateOption.date}`,
      ),
    ]),
    [
      Markup.button.callback('Back', options.reschedule ? 'booking:my-bookings' : 'booking:back:masters'),
      Markup.button.callback('Cancel', 'booking:cancel-flow'),
    ],
  ]);
};

export const buildBookingSlotsKeyboard = (
  slots: Array<{ startAt: string; label: string }>,
  options: { reschedule?: boolean } = {},
) => {
  const prefix = options.reschedule ? 'booking:reslot:' : 'booking:slot:';

  return buildInlineKeyboard([
    ...slots.map((slot) => [
      Markup.button.callback(slot.label, `${prefix}${encodeValue(slot.startAt)}`),
    ]),
    [
      Markup.button.callback('Back', options.reschedule ? 'booking:back:reschedule-dates' : 'booking:back:dates'),
      Markup.button.callback('Cancel', 'booking:cancel-flow'),
    ],
  ]);
};

export const buildBookingConfirmationKeyboard = (options: { reschedule?: boolean } = {}) => {
  const confirmCallback = options.reschedule ? 'booking:confirm-reschedule' : 'booking:confirm';
  const backCallback = options.reschedule ? 'booking:back:reschedule-slots' : 'booking:back:slots';

  return buildInlineKeyboard([
    [Markup.button.callback(options.reschedule ? 'Confirm Reschedule' : 'Continue', confirmCallback)],
    [
      Markup.button.callback('Back', backCallback),
      Markup.button.callback('Cancel', 'booking:cancel-flow'),
    ],
  ]);
};

export const buildBookingPaymentKeyboard = (options: {
  prepaymentRequired: boolean;
}) => {
  const rows = [];

  if (!options.prepaymentRequired) {
    rows.push([Markup.button.callback('Pay at Venue', 'booking:pay:AT_VENUE')]);
  }

  rows.push([Markup.button.callback('Prepay Now', 'booking:pay:PREPAY_NOW')]);
  rows.push([
    Markup.button.callback('Back', 'booking:back:confirm'),
    Markup.button.callback('Cancel', 'booking:cancel-flow'),
  ]);

  return buildInlineKeyboard(rows);
};

export const buildBookingSuccessKeyboard = () => {
  return buildInlineKeyboard([
    [Markup.button.callback('My Bookings', 'booking:my-bookings')],
    [createMainMenuButton()],
  ]);
};

export const buildMyBookingsTabsKeyboard = (activeScope: string) => {
  const tab = (scope: string, label: string) =>
    Markup.button.callback(activeScope === scope ? `• ${label} •` : label, `mybookings:tab:${scope}`);

  return buildInlineKeyboard([
    [tab('upcoming', 'Upcoming'), tab('completed', 'Completed')],
    [tab('cancelled', 'Cancelled')],
  ]);
};

export const buildMyBookingsKeyboard = (
  bookings: Array<{ id: string; label: string }>,
  activeScope: string,
) => {
  const tab = (scope: string, label: string) =>
    Markup.button.callback(activeScope === scope ? `• ${label} •` : label, `mybookings:tab:${scope}`);

  return buildInlineKeyboard([
    [tab('upcoming', 'Upcoming'), tab('completed', 'Completed')],
    [tab('cancelled', 'Cancelled')],
    ...bookings.map((booking) => [Markup.button.callback(booking.label, `booking:view:${booking.id}`)]),
    [createMainMenuButton()],
  ]);
};

export const buildBookingDetailKeyboard = (
  bookingId: string,
  options: {
    canReschedule: boolean;
    canCancel: boolean;
    canPay: boolean;
    paymentId?: string;
    canReview?: boolean;
  },
) => {
  const rows = [];

  if (options.canPay && options.paymentId) {
    rows.push([
      Markup.button.callback('Pay Now', `payment:confirm:${options.paymentId}`),
    ]);
  }

  if (options.canReview) {
    rows.push([Markup.button.callback('Leave Review', `review:start:${bookingId}`)]);
  }

  if (options.canReschedule) {
    rows.push([Markup.button.callback('Reschedule', `booking:reschedule:${bookingId}`)]);
  }

  if (options.canCancel) {
    rows.push([Markup.button.callback('Cancel Booking', `booking:cancel:${bookingId}`)]);
  }

  rows.push([
    Markup.button.callback('Back to My Bookings', 'booking:my-bookings'),
    createMainMenuButton(),
  ]);

  return buildInlineKeyboard(rows);
};
