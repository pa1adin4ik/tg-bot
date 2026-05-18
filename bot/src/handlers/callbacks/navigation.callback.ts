import { type MiddlewareFn } from 'telegraf';

import { BOOKING_FLOW_WIZARD_ID } from '../../app/register-scenes';
import { BotContext } from '../../common/context/bot-context';
import { NAVIGATION_SCREENS } from '../../common/navigation/navigation-screens';
import { renderMyBookingsScreen } from '../../modules/bookings/booking.handler';
import { resetBookingFlowState } from '../../modules/bookings/booking.state';
import {
  NavigationError,
  navigationService,
} from '../../services/navigation.service';

const NAVIGATION_PREFIX = 'nav:';

export const navigationCallbackHandler: MiddlewareFn<BotContext> = async (ctx) => {
  const callbackData = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';

  if (!callbackData.startsWith(NAVIGATION_PREFIX)) {
    return;
  }

  const [, action, value] = callbackData.split(':');

  switch (action) {
    case 'open':
      if (!value || !navigationService.isScreen(value)) {
        throw new NavigationError('Unsupported screen requested');
      }

      if (value === NAVIGATION_SCREENS.BOOK_APPOINTMENT) {
        await ctx.scene.enter(BOOKING_FLOW_WIZARD_ID);
        return;
      }

      if (value === NAVIGATION_SCREENS.MY_BOOKINGS) {
        resetBookingFlowState(ctx);
        await renderMyBookingsScreen(ctx);
        return;
      }

      await navigationService.openScreen(ctx, value);
      return;
    case 'back':
      await navigationService.goBack(ctx);
      return;
    case 'menu':
      await navigationService.goToMainMenu(ctx);
      return;
    default:
      throw new NavigationError('Unsupported navigation action');
  }
};
