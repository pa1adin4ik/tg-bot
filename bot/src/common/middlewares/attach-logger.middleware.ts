import { type MiddlewareFn } from 'telegraf';

import { BotContext } from '../context/bot-context';
import { logger } from '../../config';

export const attachLoggerMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  ctx.log = logger.child({
    updateType: ctx.updateType,
    telegramUserId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });

  ctx.log.info('Incoming Telegram update');
  await next();
};
