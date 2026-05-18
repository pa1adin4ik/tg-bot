import { type BotContext } from '../common/context/bot-context';
import { buildMainMenuKeyboard } from '../common/keyboards/main-menu.keyboard';
import type { NavigationScreenPayload } from '../common/navigation/navigation-payload';
import { buildBackKeyboard } from '../common/keyboards/navigation.keyboard';
import {
  NAVIGATION_SCREENS,
  type NavigationScreen,
} from '../common/navigation/navigation-screens';
import { renderNavigationScreen } from '../common/utils/render-navigation-screen';
import { handleMastersScreen } from '../modules/masters/masters.handler';
import { handleServicesScreen } from '../modules/services/services.handler';

const NAVIGATION_SCREEN_SET = new Set<string>(Object.values(NAVIGATION_SCREENS));

export class NavigationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NavigationError';
  }
}

const SCREEN_PAYLOADS: Record<
  Exclude<NavigationScreen, 'services' | 'masters'>,
  NavigationScreenPayload
> = {
  [NAVIGATION_SCREENS.MAIN_MENU]: {
    text:
      'Welcome to the salon assistant.\n\nChoose what you want to do next. The menu is organized for quick access to booking, schedule history, services, specialists, reviews, and contact information.',
    replyMarkup: buildMainMenuKeyboard(),
  },
  [NAVIGATION_SCREENS.BOOK_APPOINTMENT]: {
    text:
      'Book Appointment\n\nThis entry point is ready in the navigation system and reserved for the full booking wizard. The actual booking flow has not been connected in this stage.',
    replyMarkup: buildBackKeyboard(),
  },
  [NAVIGATION_SCREENS.MY_BOOKINGS]: {
    text:
      'My Bookings\n\nThis section is reserved for appointment history and status tracking. The navigation is ready, while booking data integration will be added in the next feature stage.',
    replyMarkup: buildBackKeyboard(),
  },
  [NAVIGATION_SCREENS.REVIEWS]: {
    text:
      'Reviews\n\nThis section will display client feedback and later support review-related actions. For now, it confirms the navigation and back-stack behavior.',
    replyMarkup: buildBackKeyboard(),
  },
  [NAVIGATION_SCREENS.CONTACT]: {
    text:
      'Contact\n\nUse this section for phone numbers, social links, and direct support channels. Contact details can be connected here once the business profile data is added.',
    replyMarkup: buildBackKeyboard(),
  },
  [NAVIGATION_SCREENS.LOCATION]: {
    text:
      'Location\n\nThis section is reserved for address details, map links, and branch information. The screen is ready in the menu structure for future content.',
    replyMarkup: buildBackKeyboard(),
  },
  [NAVIGATION_SCREENS.HELP]: {
    text:
      'Help\n\nCommands:\n/start - restart the welcome flow\n/menu - open the main menu\n/help - open this help screen\n\nUse the inline buttons to move between sections and the back controls to return.',
    replyMarkup: buildBackKeyboard(),
  },
};

const getScreenPayload = async (
  screen: NavigationScreen,
): Promise<NavigationScreenPayload> => {
  if (screen === NAVIGATION_SCREENS.SERVICES) {
    return handleServicesScreen();
  }

  if (screen === NAVIGATION_SCREENS.MASTERS) {
    return handleMastersScreen();
  }

  const payload = SCREEN_PAYLOADS[screen as Exclude<NavigationScreen, 'services' | 'masters'>];

  if (!payload) {
    throw new NavigationError('Unsupported navigation screen');
  }

  return payload;
};

class NavigationService {
  public isScreen(value: string): value is NavigationScreen {
    return NAVIGATION_SCREEN_SET.has(value);
  }

  public async goToMainMenu(ctx: BotContext): Promise<void> {
    ctx.session.navigation.history = [];
    ctx.session.navigation.currentScreen = NAVIGATION_SCREENS.MAIN_MENU;

    await renderNavigationScreen(ctx, await getScreenPayload(NAVIGATION_SCREENS.MAIN_MENU));
  }

  public async openScreen(
    ctx: BotContext,
    screen: NavigationScreen,
    options: { pushHistory?: boolean } = {},
  ): Promise<void> {
    const { pushHistory = true } = options;
    const currentScreen = ctx.session.navigation.currentScreen;

    if (pushHistory && currentScreen !== screen) {
      ctx.session.navigation.history.push(currentScreen);
    }

    ctx.session.navigation.currentScreen = screen;

    await renderNavigationScreen(ctx, await getScreenPayload(screen));
  }

  public async goBack(ctx: BotContext): Promise<void> {
    const previousScreen =
      ctx.session.navigation.history.pop() ?? NAVIGATION_SCREENS.MAIN_MENU;

    ctx.session.navigation.currentScreen = previousScreen;

    await renderNavigationScreen(ctx, await getScreenPayload(previousScreen));
  }
}

export const navigationService = new NavigationService();
export { NAVIGATION_SCREENS, type NavigationScreen };
