import { type MiddlewareFn } from 'telegraf';

import type { BotContext } from '../../common/context/bot-context';
import { BOOKING_FLOW_WIZARD_ID } from '../../app/register-scenes';
import { NAVIGATION_SCREENS } from '../../common/navigation/navigation-screens';
import { resetBookingFlowState } from '../../modules/bookings/booking.state';
import { navigationService } from '../../services/navigation.service';
import {
  cancelUserBookingAndRefresh,
  completeBookingFlow,
  completeRescheduleFlow,
  renderBookingConfirmationStep,
  renderBookingDateStep,
  renderBookingDetailScreen,
  renderBookingMasterStep,
  renderBookingPaymentStep,
  renderBookingServiceStep,
  renderBookingSlotStep,
  confirmBookingPayment,
  renderMyBookingsScreen,
  submitBookingReview,
  selectBookingDate,
  selectBookingMaster,
  selectBookingService,
  selectBookingSlot,
  startRescheduleFlow,
} from '../../modules/bookings/booking.handler';

export const bookingCallbackHandler: MiddlewareFn<BotContext> = async (ctx) => {
  const callbackData = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';

  if (callbackData === 'booking:start') {
    await ctx.scene.enter(BOOKING_FLOW_WIZARD_ID);
    return;
  }

  if (callbackData === 'booking:my-bookings') {
    await ctx.scene.leave().catch(() => undefined);
    resetBookingFlowState(ctx);
    await renderMyBookingsScreen(ctx);
    return;
  }

  if (callbackData === 'booking:cancel-flow') {
    await ctx.scene.leave().catch(() => undefined);
    resetBookingFlowState(ctx);
    await navigationService.openScreen(ctx, NAVIGATION_SCREENS.MAIN_MENU, { pushHistory: false });
    return;
  }

  if (callbackData === 'booking:confirm') {
    await renderBookingPaymentStep(ctx);
    return;
  }

  if (callbackData === 'booking:confirm-reschedule') {
    await completeRescheduleFlow(ctx);
    return;
  }

  if (callbackData === 'booking:back:services') {
    await renderBookingServiceStep(ctx);
    return;
  }

  if (callbackData === 'booking:back:masters') {
    await renderBookingMasterStep(ctx);
    return;
  }

  if (callbackData === 'booking:back:dates') {
    await renderBookingDateStep(ctx);
    return;
  }

  if (callbackData === 'booking:back:slots') {
    await renderBookingSlotStep(ctx);
    return;
  }

  if (callbackData === 'booking:back:confirm') {
    await renderBookingConfirmationStep(ctx);
    return;
  }

  if (callbackData === 'booking:back:reschedule-dates') {
    await renderBookingDateStep(ctx, { reschedule: true });
    return;
  }

  if (callbackData === 'booking:back:reschedule-slots') {
    await renderBookingSlotStep(ctx, { reschedule: true });
    return;
  }

  if (callbackData.startsWith('booking:service:')) {
    await selectBookingService(ctx, callbackData.replace('booking:service:', ''));
    return;
  }

  if (callbackData.startsWith('booking:master:')) {
    await selectBookingMaster(ctx, callbackData.replace('booking:master:', ''));
    return;
  }

  if (callbackData.startsWith('booking:date:')) {
    await selectBookingDate(ctx, callbackData.replace('booking:date:', ''));
    return;
  }

  if (callbackData.startsWith('booking:slot:')) {
    await selectBookingSlot(ctx, callbackData.replace('booking:slot:', ''));
    return;
  }

  if (callbackData.startsWith('booking:pay:')) {
    ctx.session.bookingFlow.paymentOption = callbackData.replace('booking:pay:', '') as
      | 'AT_VENUE'
      | 'PREPAY_NOW';
    await completeBookingFlow(ctx);
    return;
  }

  if (callbackData.startsWith('booking:view:')) {
    await renderBookingDetailScreen(ctx, callbackData.replace('booking:view:', ''));
    return;
  }

  if (callbackData.startsWith('booking:cancel:')) {
    await cancelUserBookingAndRefresh(ctx, callbackData.replace('booking:cancel:', ''));
    return;
  }

  if (callbackData.startsWith('booking:reschedule:')) {
    await startRescheduleFlow(ctx, callbackData.replace('booking:reschedule:', ''));
    return;
  }

  if (callbackData.startsWith('booking:resdate:')) {
    await selectBookingDate(ctx, callbackData.replace('booking:resdate:', ''), {
      reschedule: true,
    });
    return;
  }

  if (callbackData.startsWith('booking:reslot:')) {
    await selectBookingSlot(ctx, callbackData.replace('booking:reslot:', ''), {
      reschedule: true,
    });
    return;
  }

  if (callbackData.startsWith('mybookings:tab:')) {
    const scope = callbackData.replace('mybookings:tab:', '') as 'upcoming' | 'completed' | 'cancelled';
    await renderMyBookingsScreen(ctx, scope);
    return;
  }

  if (callbackData.startsWith('payment:confirm:')) {
    await confirmBookingPayment(ctx, callbackData.replace('payment:confirm:', ''));
    return;
  }

  if (callbackData.startsWith('review:rate:')) {
    const [, , bookingId, ratingValue] = callbackData.split(':');
    if (bookingId && ratingValue) {
      await submitBookingReview(ctx, bookingId, Number(ratingValue));
    }
    return;
  }

  if (callbackData.startsWith('review:start:')) {
    const bookingId = callbackData.replace('review:start:', '');
    await ctx.answerCbQuery().catch(() => undefined);
    await ctx.reply('Rate your visit:', {
      reply_markup: {
        inline_keyboard: [
          [1, 2, 3, 4, 5].map((rating) => ({
            text: `${rating} ★`,
            callback_data: `review:rate:${bookingId}:${rating}`,
          })),
        ],
      },
    });
  }
};
