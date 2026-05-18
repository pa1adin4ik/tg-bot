import { type MiddlewareFn } from 'telegraf';

import { BotContext } from '../context/bot-context';
import { NAVIGATION_SCREENS } from '../navigation/navigation-screens';

export const ensureSessionMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.session.navigation) {
    ctx.session.navigation = {
      currentScreen: NAVIGATION_SCREENS.MAIN_MENU,
      history: [],
      initialized: false,
    };
  }

  await next();
};
