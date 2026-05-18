import { type MiddlewareFn } from 'telegraf';

import { BotContext } from '../../common/context/bot-context';
import { START_WIZARD_ID } from '../../app/register-scenes';

export const startCommandHandler: MiddlewareFn<BotContext> = async (ctx) => {
  await ctx.scene.enter(START_WIZARD_ID);
};
