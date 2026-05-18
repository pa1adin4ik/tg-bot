import { type Telegraf } from 'telegraf';

import { logger } from '../config';
import { isCallbackQueryContext } from '../common/utils/is-callback-query-context';
import { BotContext } from '../common/context/bot-context';

export const registerErrorHandler = (bot: Telegraf<BotContext>): void => {
  bot.catch(async (error, ctx) => {
    const scopedLogger = ctx.log ?? logger;

    scopedLogger.error(
      {
        error,
        updateType: ctx.updateType,
        telegramUserId: ctx.from?.id,
      },
      'Unhandled Telegram bot error',
    );

    try {
      if (isCallbackQueryContext(ctx)) {
        await ctx.answerCbQuery('Something went wrong. Please try again.');
      }

      await ctx.reply('Something went wrong. Please try again in a moment.');
    } catch (replyError) {
      scopedLogger.error({ error: replyError }, 'Failed to send bot error response');
    }
  });
};
