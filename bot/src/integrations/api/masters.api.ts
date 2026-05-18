import { apiGet } from './http-client';

export interface BotMasterListItem {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  experienceYears: number | null;
  ratingAvg: string;
  reviewCount: number;
  isVisible: boolean;
  specializations: string[];
}

export interface BotMasterDetail extends BotMasterListItem {
  user: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  services: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  schedules: Array<{
    id?: string;
    type: 'WORKING_HOURS' | 'BLOCKED_TIME';
    dayOfWeek: string | null;
    specificDate: string | null;
    startMinute: number;
    endMinute: number;
    timezone: string;
    isRecurring: boolean;
    isActive: boolean;
    validFrom: string | null;
    validTo: string | null;
  }>;
  portfolio: Array<{
    id?: string;
    title: string;
    description: string | null;
    mediaUrl: string;
    mediaType: 'IMAGE' | 'VIDEO';
    sortOrder: number;
    isPublished: boolean;
  }>;
}

export const listBotMasters = async (serviceSlug?: string): Promise<BotMasterListItem[]> => {
  return apiGet<BotMasterListItem[]>('/masters', {
    serviceSlug,
  });
};

export const getBotMaster = async (masterId: string): Promise<BotMasterDetail> => {
  return apiGet<BotMasterDetail>(`/masters/${masterId}`);
};
