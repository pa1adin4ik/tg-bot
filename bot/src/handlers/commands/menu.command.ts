import { type MiddlewareFn } from 'telegraf';

import { BotContext } from '../../common/context/bot-context';
import { navigationService } from '../../services/navigation.service';

export const menuCommandHandler: MiddlewareFn<BotContext> = async (ctx) => {
  await navigationService.goToMainMenu(ctx);
};
