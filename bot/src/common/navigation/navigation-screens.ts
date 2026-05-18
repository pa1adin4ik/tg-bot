export const NAVIGATION_SCREENS = {
  MAIN_MENU: 'main-menu',
  BOOK_APPOINTMENT: 'book-appointment',
  MY_BOOKINGS: 'my-bookings',
  SERVICES: 'services',
  MASTERS: 'masters',
  REVIEWS: 'reviews',
  CONTACT: 'contact',
  LOCATION: 'location',
  HELP: 'help',
} as const;

export type NavigationScreen =
  (typeof NAVIGATION_SCREENS)[keyof typeof NAVIGATION_SCREENS];
