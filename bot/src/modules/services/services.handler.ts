import type { NavigationScreenPayload } from '../../common/navigation/navigation-payload';

import { buildServicesScreenPayload } from './services.screen';

export const handleServicesScreen = async (): Promise<NavigationScreenPayload> => {
  return buildServicesScreenPayload();
};
