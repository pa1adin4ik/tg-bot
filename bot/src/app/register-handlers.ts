import { type Telegraf } from 'telegraf';

import { BotContext } from '../common/context/bot-context';
import { bookingCallbackHandler } from '../handlers/callbacks/booking.callback';
import { masterCallbackHandler } from '../handlers/callbacks/master.callback';
import { handleUnknownCallback } from '../handlers/callbacks/unknown.callback';
import { navigationCallbackHandler } from '../handlers/callbacks/navigation.callback';
import { helpCommandHandler } from '../handlers/commands/help.command';
import { menuCommandHandler } from '../handlers/commands/menu.command';
import { startCommandHandler } from '../handlers/commands/start.command';

export const registerHandlers = (bot: Telegraf<BotContext>): void => {
  bot.start(startCommandHandler);
  bot.command('menu', menuCommandHandler);
  bot.command('help', helpCommandHandler);

  bot.action(/^booking:/, bookingCallbackHandler);
  bot.action(/^mybookings:/, bookingCallbackHandler);
  bot.action(/^payment:/, bookingCallbackHandler);
  bot.action(/^review:/, bookingCallbackHandler);
  bot.action(/^nav:/, navigationCallbackHandler);
  bot.action(/^master:/, masterCallbackHandler);
  bot.on('callback_query', handleUnknownCallback);
};
