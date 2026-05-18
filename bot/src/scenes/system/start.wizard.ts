import { Scenes } from 'telegraf';

import { MAIN_MENU_SCENE_ID } from './main-menu.scene';
import { BotContext } from '../../common/context/bot-context';

export const START_WIZARD_ID = 'start-wizard';

export const startWizard = new Scenes.WizardScene<BotContext>(
  START_WIZARD_ID,
  async (ctx) => {
    ctx.session.navigation.initialized = true;

    const firstName = ctx.from?.first_name ?? 'there';

    await ctx.reply(
      `Hello, ${firstName}. This bot foundation is ready with scenes, session state, inline navigation, and command handling.`,
    );

    await ctx.scene.enter(MAIN_MENU_SCENE_ID);
  },
);
