import type { NavigationScreenPayload } from '../../common/navigation/navigation-payload';

import { buildMasterDetailPayload, buildMastersListPayload } from './masters.screen';

export const handleMastersScreen = async (): Promise<NavigationScreenPayload> => {
  return buildMastersListPayload();
};

export const handleMasterDetailScreen = async (
  masterId: string,
): Promise<NavigationScreenPayload> => {
  return buildMasterDetailPayload(masterId);
};
