import { botConfig } from '../../config';
import { demoApi } from '../../demo/demo-api';
import { apiGet } from './http-client';

export interface BotServiceCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BotService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  currency: string;
  prepaymentRequired: boolean;
  prepaymentAmount: string | null;
  isActive: boolean;
  category: BotServiceCategory;
}

export const listBotServices = async (): Promise<BotService[]> => {
  if (botConfig.demoMode) {
    return demoApi.listServices();
  }

  return apiGet<BotService[]>('/services', {
    status: 'active',
  });
};
