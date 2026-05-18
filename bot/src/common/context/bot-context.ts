import type { Logger } from 'pino';
import { type Context, type Scenes } from 'telegraf';

import { type NavigationScreen } from '../navigation/navigation-screens';

export interface NavigationSessionState {
  currentScreen: NavigationScreen;
  history: NavigationScreen[];
  initialized: boolean;
}

export interface BookingFlowSessionState {
  mode: 'create' | 'reschedule' | null;
  serviceId?: string;
  serviceName?: string;
  serviceSlug?: string;
  prepaymentRequired?: boolean;
  prepaymentAmount?: string | null;
  masterId?: string;
  masterName?: string;
  selectedDate?: string;
  selectedDateLabel?: string;
  slotStartAt?: string;
  slotLabel?: string;
  paymentOption?: 'AT_VENUE' | 'PREPAY_NOW';
  rescheduleBookingId?: string;
}

export interface BotSceneSession extends Scenes.WizardSessionData {}

export interface BotSession extends Scenes.WizardSession<BotSceneSession> {
  navigation: NavigationSessionState;
  bookingFlow: BookingFlowSessionState;
  myBookingsScope: 'upcoming' | 'completed' | 'cancelled';
}

export interface BotContext extends Context {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, BotSceneSession>;
  wizard: Scenes.WizardContextWizard<BotContext>;
  log: Logger;
}
