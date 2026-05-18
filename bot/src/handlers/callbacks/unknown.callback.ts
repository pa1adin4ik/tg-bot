import { type MiddlewareFn } from 'telegraf';

import { BotContext } from '../../common/context/bot-context';

export const handleUnknownCallback: MiddlewareFn<BotContext> = async (ctx) => {
  await ctx.answerCbQuery('Unknown action');
};
