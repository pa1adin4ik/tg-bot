import { type Context, type Markup } from 'telegraf';

import { isCallbackQueryContext } from './is-callback-query-context';

interface ScreenPayload {
  text: string;
  replyMarkup: ReturnType<typeof Markup.inlineKeyboard>;
}

const isMessageNotModifiedError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('message is not modified');
};

export const renderNavigationScreen = async (
  ctx: Context,
  payload: ScreenPayload,
): Promise<void> => {
  if (isCallbackQueryContext(ctx)) {
    await ctx.answerCbQuery();

    try {
      await ctx.editMessageText(payload.text, payload.replyMarkup);
      return;
    } catch (error) {
      if (!isMessageNotModifiedError(error)) {
        throw error;
      }
    }
  }

  await ctx.reply(payload.text, payload.replyMarkup);
};
