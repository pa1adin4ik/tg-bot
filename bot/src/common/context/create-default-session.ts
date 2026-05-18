import { type BotSession } from './bot-context';
import { NAVIGATION_SCREENS } from '../navigation/navigation-screens';

export const createDefaultSession = (): BotSession => {
  return {
    __scenes: {
      state: {},
      cursor: 0,
    },
    navigation: {
      currentScreen: NAVIGATION_SCREENS.MAIN_MENU,
      history: [],
      initialized: false,
    },
    bookingFlow: {
      mode: null,
    },
    myBookingsScope: 'upcoming',
  };
};
