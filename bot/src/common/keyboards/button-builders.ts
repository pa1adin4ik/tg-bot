import { Markup } from 'telegraf';

import { type NavigationScreen } from '../navigation/navigation-screens';

export const createNavigationButton = (label: string, screen: NavigationScreen) => {
  return Markup.button.callback(label, `nav:open:${screen}`);
};

export const createBackButton = (label = 'Back') => {
  return Markup.button.callback(label, 'nav:back');
};

export const createMainMenuButton = (label = 'Main Menu') => {
  return Markup.button.callback(label, 'nav:menu');
};
