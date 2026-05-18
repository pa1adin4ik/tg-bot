import { session, type Telegraf } from 'telegraf';

import { createDefaultSession } from '../common/context/create-default-session';
import { BotContext } from '../common/context/bot-context';
import { attachLoggerMiddleware } from '../common/middlewares/attach-logger.middleware';
import { ensureSessionMiddleware } from '../common/middlewares/ensure-session.middleware';
import { registerScenes } from './register-scenes';

export const registerMiddlewares = (bot: Telegraf<BotContext>): void => {
  const stage = registerScenes();

  bot.use(attachLoggerMiddleware);
  bot.use(
    session({
      defaultSession: createDefaultSession,
    }),
  );
  bot.use(ensureSessionMiddleware);
  bot.use(stage.middleware());
};
