import { type MiddlewareFn } from 'telegraf';

import { BotContext } from '../../common/context/bot-context';
import { NAVIGATION_SCREENS } from '../../common/navigation/navigation-screens';
import { navigationService } from '../../services/navigation.service';

export const helpCommandHandler: MiddlewareFn<BotContext> = async (ctx) => {
  await navigationService.openScreen(ctx, NAVIGATION_SCREENS.HELP, {
    pushHistory: false,
  });
};
