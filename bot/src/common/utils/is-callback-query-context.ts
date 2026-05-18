import { type Context } from 'telegraf';

export const isCallbackQueryContext = (ctx: Context): boolean => {
  return ctx.updateType === 'callback_query';
};
