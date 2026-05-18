import { Telegraf } from 'telegraf';

import { BotContext } from '../common/context/bot-context';
import { env } from '../config/env';
import { registerErrorHandler } from './register-error-handler';
import { registerHandlers } from './register-handlers';
import { registerMiddlewares } from './register-middlewares';

export const createBot = (): Telegraf<BotContext> => {
  const bot = new Telegraf<BotContext>(env.BOT_TOKEN);

  registerMiddlewares(bot);
  registerHandlers(bot);
  registerErrorHandler(bot);

  return bot;
};
