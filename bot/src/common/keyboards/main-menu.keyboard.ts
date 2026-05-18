import { NAVIGATION_SCREENS } from '../navigation/navigation-screens';
import { createNavigationButton } from './button-builders';
import { buildInlineKeyboard } from './inline-keyboard.builder';

export const buildMainMenuKeyboard = () => {
  return buildInlineKeyboard([
    [createNavigationButton('Book Appointment', NAVIGATION_SCREENS.BOOK_APPOINTMENT)],
    [
      createNavigationButton('My Bookings', NAVIGATION_SCREENS.MY_BOOKINGS),
      createNavigationButton('Services', NAVIGATION_SCREENS.SERVICES),
    ],
    [
      createNavigationButton('Masters', NAVIGATION_SCREENS.MASTERS),
      createNavigationButton('Reviews', NAVIGATION_SCREENS.REVIEWS),
    ],
    [
      createNavigationButton('Contact', NAVIGATION_SCREENS.CONTACT),
      createNavigationButton('Location', NAVIGATION_SCREENS.LOCATION),
    ],
  ]);
};
