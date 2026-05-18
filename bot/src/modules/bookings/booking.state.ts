import type { BotContext, BookingFlowSessionState } from '../../common/context/bot-context';

const createEmptyBookingFlowState = (): BookingFlowSessionState => ({
  mode: null,
});

export const resetBookingFlowState = (ctx: BotContext): void => {
  ctx.session.bookingFlow = createEmptyBookingFlowState();
};

export const startBookingFlowState = (ctx: BotContext): void => {
  ctx.session.bookingFlow = {
    mode: 'create',
  };
};

export const startRescheduleFlowState = (
  ctx: BotContext,
  payload: {
    bookingId: string;
    serviceId: string;
    serviceName: string;
    serviceSlug: string;
    masterId: string;
    masterName: string;
  },
): void => {
  ctx.session.bookingFlow = {
    mode: 'reschedule',
    rescheduleBookingId: payload.bookingId,
    serviceId: payload.serviceId,
    serviceName: payload.serviceName,
    serviceSlug: payload.serviceSlug,
    masterId: payload.masterId,
    masterName: payload.masterName,
  };
};
