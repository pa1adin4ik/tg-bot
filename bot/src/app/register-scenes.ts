import { Scenes } from 'telegraf';

import { BotContext } from '../common/context/bot-context';
import { BOOKING_FLOW_WIZARD_ID, bookingFlowWizard } from '../scenes/booking/booking-flow.wizard';
import { MAIN_MENU_SCENE_ID, mainMenuScene } from '../scenes/system/main-menu.scene';
import { START_WIZARD_ID, startWizard } from '../scenes/system/start.wizard';

export const registerScenes = (): Scenes.Stage<BotContext> => {
  return new Scenes.Stage<BotContext>([startWizard, mainMenuScene, bookingFlowWizard]);
};

export { BOOKING_FLOW_WIZARD_ID, MAIN_MENU_SCENE_ID, START_WIZARD_ID };
