import type { Markup } from 'telegraf';
import type { InlineKeyboardMarkup } from 'telegraf/types';

export interface NavigationScreenPayload {
  text: string;
  replyMarkup: ReturnType<typeof Markup.inlineKeyboard>;
}
