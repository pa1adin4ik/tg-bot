import { Scenes } from 'telegraf';

import { BotContext } from '../../common/context/bot-context';
import { navigationService } from '../../services/navigation.service';

export const MAIN_MENU_SCENE_ID = 'main-menu-scene';

export const mainMenuScene = new Scenes.BaseScene<BotContext>(MAIN_MENU_SCENE_ID);

mainMenuScene.enter(async (ctx) => {
  await navigationService.goToMainMenu(ctx);
});
