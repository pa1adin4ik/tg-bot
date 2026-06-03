import { type Telegraf } from 'telegraf';

import { logger } from '../config';
import { isCallbackQueryContext } from '../common/utils/is-callback-query-context';
import { BotContext } from '../common/context/bot-context';

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: 'statusCode' in error ? error.statusCode : undefined,
      responseBody: 'responseBody' in error ? error.responseBody : undefined,
    };
  }

  return error;
};

export const registerErrorHandler = (bot: Telegraf<BotContext>): void => {
  bot.catch(async (error, ctx) => {
    const scopedLogger = ctx.log ?? logger;

    scopedLogger.error(
      {
        error: serializeError(error),
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
