import { type MiddlewareFn } from 'telegraf';

import { BotContext } from '../../common/context/bot-context';
import { renderNavigationScreen } from '../../common/utils/render-navigation-screen';
import {
  handleMasterDetailScreen,
  handleMastersScreen,
} from '../../modules/masters/masters.handler';

export const masterCallbackHandler: MiddlewareFn<BotContext> = async (ctx) => {
  const callbackData = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';

  if (callbackData === 'master:list') {
    await renderNavigationScreen(ctx, await handleMastersScreen());
    return;
  }

  if (!callbackData.startsWith('master:open:')) {
    return;
  }

  const masterId = callbackData.replace('master:open:', '');

  await renderNavigationScreen(ctx, await handleMasterDetailScreen(masterId));
};
