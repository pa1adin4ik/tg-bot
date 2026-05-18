import { Markup } from 'telegraf';
import type { InlineKeyboardButton } from 'telegraf/types';

export const buildInlineKeyboard = (rows: InlineKeyboardButton[][]) => {
  return Markup.inlineKeyboard(rows);
};
