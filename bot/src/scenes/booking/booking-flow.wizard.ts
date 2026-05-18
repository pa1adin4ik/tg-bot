import { Scenes } from 'telegraf';

import type { BotContext } from '../../common/context/bot-context';
import { renderBookingServiceStep } from '../../modules/bookings/booking.handler';
import { resetBookingFlowState, startBookingFlowState } from '../../modules/bookings/booking.state';

export const BOOKING_FLOW_WIZARD_ID = 'booking-flow-wizard';

const waitStep = async () => undefined;

export const bookingFlowWizard = new Scenes.WizardScene<BotContext>(
  BOOKING_FLOW_WIZARD_ID,
  waitStep,
  waitStep,
  waitStep,
  waitStep,
  waitStep,
  waitStep,
);

bookingFlowWizard.enter(async (ctx) => {
  startBookingFlowState(ctx);
  ctx.wizard.selectStep(0);
  await renderBookingServiceStep(ctx);
});

bookingFlowWizard.leave((ctx) => {
  resetBookingFlowState(ctx);
});
