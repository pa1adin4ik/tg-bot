import { DateTime } from 'luxon';

import type { BotContext } from '../../common/context/bot-context';
import {
  buildBookingConfirmationKeyboard,
  buildBookingDatesKeyboard,
  buildBookingDetailKeyboard,
  buildBookingMastersKeyboard,
  buildBookingPaymentKeyboard,
  buildBookingServicesKeyboard,
  buildBookingSlotsKeyboard,
  buildBookingSuccessKeyboard,
  buildMyBookingsKeyboard,
} from '../../common/keyboards/booking.keyboard';
import { renderNavigationScreen } from '../../common/utils/render-navigation-screen';
import {
  cancelUserBooking,
  createBotBooking,
  listBookingDates,
  listBookingSlots,
  listRescheduleSlots,
  getUserBooking,
  listUserBookings,
  rescheduleUserBooking,
  type BookingListScope,
  type BotBookingSummary,
} from '../../integrations/api/bookings.api';
import { confirmPayment, getBookingPayment } from '../../integrations/api/payments.api';
import { createReview } from '../../integrations/api/reviews.api';
import { listBotMasters } from '../../integrations/api/masters.api';
import { listBotServices } from '../../integrations/api/services.api';
import { resetBookingFlowState, startRescheduleFlowState } from './booking.state';

const decodeValue = (value: string): string => decodeURIComponent(value);

const getTelegramUserPayload = (ctx: BotContext) => {
  if (!ctx.from) {
    throw new Error('Telegram user context is missing');
  }

  return {
    telegramId: String(ctx.from.id),
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    username: ctx.from.username,
  };
};

const formatBookingDateTime = (startAt: string, endAt: string): string => {
  const start = DateTime.fromISO(startAt);
  const end = DateTime.fromISO(endAt);

  return `${start.toFormat('dd LLL, HH:mm')} - ${end.toFormat('HH:mm')}`;
};

const formatBookingStatus = (booking: BotBookingSummary): string => {
  const labels: Record<string, string> = {
    AWAITING_PREPAYMENT: 'Awaiting prepayment',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELED: 'Cancelled',
    EXPIRED: 'Expired',
    IN_PROGRESS: 'In progress',
    PENDING: 'Pending',
    NO_SHOW: 'No show',
  };

  const base = labels[booking.status] ?? booking.status;

  if (booking.status === 'AWAITING_PREPAYMENT' && booking.reservationExpiresAt) {
    return `${base} until ${DateTime.fromISO(booking.reservationExpiresAt).toFormat('HH:mm')}`;
  }

  return base;
};

export const renderBookingServiceStep = async (ctx: BotContext): Promise<void> => {
  const services = await listBotServices();

  await renderNavigationScreen(ctx, {
    text: 'Book Appointment\n\nStep 1 of 6\nChoose a service to continue.',
    replyMarkup: buildBookingServicesKeyboard(
      services.map((service) => ({
        id: service.id,
        name: service.name,
      })),
    ),
  });
};

export const renderBookingMasterStep = async (ctx: BotContext): Promise<void> => {
  const serviceSlug = ctx.session.bookingFlow.serviceSlug;

  if (!serviceSlug) {
    await renderBookingServiceStep(ctx);
    return;
  }

  const masters = await listBotMasters(serviceSlug);

  await renderNavigationScreen(ctx, {
    text: `Book Appointment\n\nStep 2 of 6\nService: ${ctx.session.bookingFlow.serviceName}\n\nChoose a master.`,
    replyMarkup: buildBookingMastersKeyboard(
      masters.map((master) => ({
        id: master.id,
        fullName: master.fullName,
      })),
    ),
  });
};

export const renderBookingDateStep = async (
  ctx: BotContext,
  options: { reschedule?: boolean } = {},
): Promise<void> => {
  const serviceId = ctx.session.bookingFlow.serviceId;
  const masterId = ctx.session.bookingFlow.masterId;

  if (!serviceId || !masterId) {
    await renderBookingMasterStep(ctx);
    return;
  }

  const dates = await listBookingDates(serviceId, masterId);

  await renderNavigationScreen(ctx, {
    text: options.reschedule
      ? `Reschedule Booking\n\nChoose a new date for ${ctx.session.bookingFlow.masterName}.`
      : `Book Appointment\n\nStep 3 of 6\nService: ${ctx.session.bookingFlow.serviceName}\nMaster: ${ctx.session.bookingFlow.masterName}\n\nChoose a date.`,
    replyMarkup: buildBookingDatesKeyboard(dates, options),
  });
};

export const renderBookingSlotStep = async (
  ctx: BotContext,
  options: { reschedule?: boolean } = {},
): Promise<void> => {
  const selectedDate = ctx.session.bookingFlow.selectedDate;

  if (!selectedDate) {
    await renderBookingDateStep(ctx, options);
    return;
  }

  let slots;

  if (options.reschedule) {
    if (!ctx.session.bookingFlow.rescheduleBookingId || !ctx.from) {
      await renderMyBookingsScreen(ctx);
      return;
    }

    slots = await listRescheduleSlots(
      ctx.session.bookingFlow.rescheduleBookingId,
      String(ctx.from.id),
      selectedDate,
    );
  } else {
    if (!ctx.session.bookingFlow.serviceId || !ctx.session.bookingFlow.masterId) {
      await renderBookingDateStep(ctx);
      return;
    }

    slots = await listBookingSlots(
      ctx.session.bookingFlow.serviceId,
      ctx.session.bookingFlow.masterId,
      selectedDate,
    );
  }

  await renderNavigationScreen(ctx, {
    text: options.reschedule
      ? `Reschedule Booking\n\nDate: ${ctx.session.bookingFlow.selectedDateLabel}\n\nChoose a new time slot.`
      : `Book Appointment\n\nStep 4 of 6\nDate: ${ctx.session.bookingFlow.selectedDateLabel}\n\nChoose a time slot.`,
    replyMarkup: buildBookingSlotsKeyboard(
      slots.map((slot) => ({
        startAt: slot.startAt,
        label: slot.label,
      })),
      options,
    ),
  });
};

export const renderBookingConfirmationStep = async (
  ctx: BotContext,
  options: { reschedule?: boolean } = {},
): Promise<void> => {
  const state = ctx.session.bookingFlow;

  if (!state.selectedDate || !state.slotLabel) {
    await renderBookingSlotStep(ctx, options);
    return;
  }

  const text = options.reschedule
    ? `Reschedule Booking\n\nMaster: ${state.masterName}\nNew date: ${state.selectedDateLabel}\nNew time: ${state.slotLabel}\n\nConfirm the reschedule.`
    : `Booking Confirmation\n\nStep 5 of 6\nService: ${state.serviceName}\nMaster: ${state.masterName}\nDate: ${state.selectedDateLabel}\nTime: ${state.slotLabel}\n\nConfirm your booking details.`;

  await renderNavigationScreen(ctx, {
    text,
    replyMarkup: buildBookingConfirmationKeyboard(options),
  });
};

export const renderBookingPaymentStep = async (ctx: BotContext): Promise<void> => {
  const state = ctx.session.bookingFlow;

  await renderNavigationScreen(ctx, {
    text:
      `Payment\n\nStep 6 of 6\nService: ${state.serviceName}\nMaster: ${state.masterName}\nDate: ${state.selectedDateLabel}\nTime: ${state.slotLabel}\n\n` +
      (state.prepaymentRequired
        ? `This service requires a prepayment${state.prepaymentAmount ? ` of ${state.prepaymentAmount}` : ''}.`
        : 'Choose whether to prepay now or pay at the venue.'),
    replyMarkup: buildBookingPaymentKeyboard({
      prepaymentRequired: Boolean(state.prepaymentRequired),
    }),
  });
};

export const completeBookingFlow = async (ctx: BotContext): Promise<void> => {
  const state = ctx.session.bookingFlow;

  if (!state.serviceId || !state.masterId || !state.slotStartAt || !state.paymentOption) {
    await renderBookingServiceStep(ctx);
    return;
  }

  const booking = await createBotBooking({
    telegramUser: getTelegramUserPayload(ctx),
    serviceId: state.serviceId,
    masterId: state.masterId,
    slotStartAt: state.slotStartAt,
    paymentOption: state.paymentOption,
  });

  const message =
    booking.status === 'AWAITING_PREPAYMENT'
      ? `Booking Reserved\n\n${booking.service.name} with ${booking.master.fullName}\n${formatBookingDateTime(booking.startAt, booking.endAt)}\n\nPrepayment reserved: ${booking.prepaymentAmount} ${booking.currency}\nReservation expires at ${DateTime.fromISO(booking.reservationExpiresAt!).toFormat('HH:mm')}.`
      : `Booking Confirmed\n\n${booking.service.name} with ${booking.master.fullName}\n${formatBookingDateTime(booking.startAt, booking.endAt)}\n\nTotal: ${booking.totalPrice} ${booking.currency}.`;

  resetBookingFlowState(ctx);
  await ctx.scene.leave().catch(() => undefined);

  await renderNavigationScreen(ctx, {
    text: message,
    replyMarkup: buildBookingSuccessKeyboard(),
  });
};

export const renderMyBookingsScreen = async (
  ctx: BotContext,
  scope: BookingListScope = ctx.session.myBookingsScope,
): Promise<void> => {
  if (!ctx.from) {
    return;
  }

  ctx.session.myBookingsScope = scope as BotContext['session']['myBookingsScope'];

  const bookings = await listUserBookings(String(ctx.from.id), scope);

  const scopeLabel =
    scope === 'completed' ? 'completed' : scope === 'cancelled' ? 'cancelled' : 'upcoming';

  if (bookings.length === 0) {
    await renderNavigationScreen(ctx, {
      text: `My Bookings\n\nNo ${scopeLabel} bookings found.`,
      replyMarkup: buildMyBookingsKeyboard([], scope),
    });
    return;
  }

  await renderNavigationScreen(ctx, {
    text: 'My Bookings\n\nSelect a booking to view details and actions.',
    replyMarkup: buildMyBookingsKeyboard(
      bookings.map((booking) => ({
        id: booking.id,
        label: `${booking.service.name} • ${DateTime.fromISO(booking.startAt).toFormat('dd LLL HH:mm')}`,
      })),
      scope,
    ),
  });
};

export const renderBookingDetailScreen = async (ctx: BotContext, bookingId: string): Promise<void> => {
  if (!ctx.from) {
    return;
  }

  let booking: BotBookingSummary;

  try {
    booking = await getUserBooking(bookingId, String(ctx.from.id));
  } catch {
    await renderMyBookingsScreen(ctx);
    return;
  }

  const payment = await getBookingPayment(booking.id, String(ctx.from.id));
  const canManage = ['AWAITING_PREPAYMENT', 'CONFIRMED'].includes(booking.status);
  const canPay =
    booking.status === 'AWAITING_PREPAYMENT' &&
    payment !== null &&
    ['RESERVED', 'FAILED', 'PENDING'].includes(payment.status);

  await renderNavigationScreen(ctx, {
    text:
      `${booking.service.name}\n\n` +
      `Master: ${booking.master.fullName}\n` +
      `When: ${formatBookingDateTime(booking.startAt, booking.endAt)}\n` +
      `Status: ${formatBookingStatus(booking)}\n` +
      `Total: ${booking.totalPrice} ${booking.currency}` +
      (booking.prepaymentAmount ? `\nPrepayment: ${booking.prepaymentAmount} ${booking.currency}` : '') +
      (booking.notes ? `\nNotes: ${booking.notes}` : ''),
    replyMarkup: buildBookingDetailKeyboard(booking.id, {
      canReschedule: canManage,
      canCancel: canManage,
      canPay,
      paymentId: payment?.id,
      canReview: booking.status === 'COMPLETED',
    }),
  });
};

export const confirmBookingPayment = async (ctx: BotContext, paymentId: string): Promise<void> => {
  if (!ctx.from) {
    return;
  }

  await confirmPayment(paymentId, String(ctx.from.id));
  await renderMyBookingsScreen(ctx, 'upcoming');
};

export const submitBookingReview = async (
  ctx: BotContext,
  bookingId: string,
  rating: number,
): Promise<void> => {
  if (!ctx.from) {
    return;
  }

  await createReview({
    bookingId,
    telegramId: String(ctx.from.id),
    rating,
  });

  await renderNavigationScreen(ctx, {
    text: 'Thank you! Your review was submitted and is pending moderation.',
    replyMarkup: buildBookingSuccessKeyboard(),
  });
};

export const startRescheduleFlow = async (ctx: BotContext, bookingId: string): Promise<void> => {
  if (!ctx.from) {
    return;
  }

  const bookings = await listUserBookings(String(ctx.from.id), 'all');
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) {
    await renderMyBookingsScreen(ctx);
    return;
  }

  startRescheduleFlowState(ctx, {
    bookingId: booking.id,
    serviceId: booking.service.id,
    serviceName: booking.service.name,
    serviceSlug: booking.service.id,
    masterId: booking.master.id,
    masterName: booking.master.fullName,
  });

  await renderBookingDateStep(ctx, { reschedule: true });
};

export const completeRescheduleFlow = async (ctx: BotContext): Promise<void> => {
  if (!ctx.from || !ctx.session.bookingFlow.rescheduleBookingId || !ctx.session.bookingFlow.slotStartAt) {
    await renderMyBookingsScreen(ctx);
    return;
  }

  const booking = await rescheduleUserBooking(
    ctx.session.bookingFlow.rescheduleBookingId,
    String(ctx.from.id),
    ctx.session.bookingFlow.slotStartAt,
  );

  resetBookingFlowState(ctx);
  await ctx.scene.leave().catch(() => undefined);

  await renderNavigationScreen(ctx, {
    text:
      `Booking Rescheduled\n\n${booking.service.name} with ${booking.master.fullName}\n${formatBookingDateTime(booking.startAt, booking.endAt)}\n\nStatus: ${formatBookingStatus(booking)}`,
    replyMarkup: buildBookingSuccessKeyboard(),
  });
};

export const cancelUserBookingAndRefresh = async (ctx: BotContext, bookingId: string): Promise<void> => {
  if (!ctx.from) {
    return;
  }

  await cancelUserBooking(bookingId, String(ctx.from.id));
  await renderMyBookingsScreen(ctx);
};

export const selectBookingService = async (ctx: BotContext, serviceId: string): Promise<void> => {
  const services = await listBotServices();
  const selectedService = services.find((service) => service.id === serviceId);

  if (!selectedService) {
    await renderBookingServiceStep(ctx);
    return;
  }

  ctx.session.bookingFlow = {
    ...ctx.session.bookingFlow,
    mode: 'create',
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    serviceSlug: selectedService.slug,
    prepaymentRequired: selectedService.prepaymentRequired,
    prepaymentAmount: selectedService.prepaymentAmount,
    masterId: undefined,
    selectedDate: undefined,
    slotStartAt: undefined,
    paymentOption: undefined,
  };

  await renderBookingMasterStep(ctx);
};

export const selectBookingMaster = async (ctx: BotContext, masterId: string): Promise<void> => {
  const masters = await listBotMasters(ctx.session.bookingFlow.serviceSlug);
  const selectedMaster = masters.find((master) => master.id === masterId);

  if (!selectedMaster) {
    await renderBookingMasterStep(ctx);
    return;
  }

  ctx.session.bookingFlow = {
    ...ctx.session.bookingFlow,
    masterId: selectedMaster.id,
    masterName: selectedMaster.fullName,
    selectedDate: undefined,
    slotStartAt: undefined,
  };

  await renderBookingDateStep(ctx);
};

export const selectBookingDate = async (
  ctx: BotContext,
  date: string,
  options: { reschedule?: boolean } = {},
): Promise<void> => {
  const dates = await listBookingDates(
    ctx.session.bookingFlow.serviceId!,
    ctx.session.bookingFlow.masterId!,
  );
  const selectedDate = dates.find((item) => item.date === date);

  ctx.session.bookingFlow = {
    ...ctx.session.bookingFlow,
    selectedDate: date,
    selectedDateLabel: selectedDate?.label ?? date,
    slotStartAt: undefined,
    slotLabel: undefined,
  };

  await renderBookingSlotStep(ctx, options);
};

export const selectBookingSlot = async (
  ctx: BotContext,
  encodedSlotStartAt: string,
  options: { reschedule?: boolean } = {},
): Promise<void> => {
  const slotStartAt = decodeValue(encodedSlotStartAt);

  const slots = options.reschedule
    ? await listRescheduleSlots(
        ctx.session.bookingFlow.rescheduleBookingId!,
        String(ctx.from?.id ?? ''),
        ctx.session.bookingFlow.selectedDate!,
      )
    : await listBookingSlots(
        ctx.session.bookingFlow.serviceId!,
        ctx.session.bookingFlow.masterId!,
        ctx.session.bookingFlow.selectedDate!,
      );

  const selectedSlot = slots.find((slot) => slot.startAt === slotStartAt);

  if (!selectedSlot) {
    await renderBookingSlotStep(ctx, options);
    return;
  }

  ctx.session.bookingFlow = {
    ...ctx.session.bookingFlow,
    slotStartAt,
    slotLabel: selectedSlot.label,
  };

  await renderBookingConfirmationStep(ctx, options);
};
