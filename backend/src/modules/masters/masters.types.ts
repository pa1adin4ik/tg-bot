import type { DayOfWeek, PortfolioMediaType, ScheduleType } from '@prisma/client';

import type { MasterVisibilityFilter } from './masters.constants';

export interface ListPublicMastersQuery {
  search?: string;
  serviceSlug?: string;
}

export interface ListAdminMastersQuery {
  search?: string;
  visibility: MasterVisibilityFilter;
}

export interface MasterScheduleInput {
  type: ScheduleType;
  dayOfWeek?: DayOfWeek;
  specificDate?: string;
  startMinute: number;
  endMinute: number;
  timezone: string;
  isRecurring: boolean;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
}

export interface PortfolioWorkInput {
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: PortfolioMediaType;
  sortOrder: number;
  isPublished: boolean;
}

export interface UpsertMasterInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  experienceYears?: number;
  isVisible: boolean;
  serviceIds: string[];
  schedules: MasterScheduleInput[];
  portfolio: PortfolioWorkInput[];
}

export interface MasterListItemResponse {
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

export interface MasterScheduleResponse {
  id?: string;
  type: ScheduleType;
  dayOfWeek: DayOfWeek | null;
  specificDate: string | null;
  startMinute: number;
  endMinute: number;
  timezone: string;
  isRecurring: boolean;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
}

export interface PortfolioWorkResponse {
  id?: string;
  title: string;
  description: string | null;
  mediaUrl: string;
  mediaType: PortfolioMediaType;
  sortOrder: number;
  isPublished: boolean;
}

export interface MasterDetailResponse extends MasterListItemResponse {
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
  schedules: MasterScheduleResponse[];
  portfolio: PortfolioWorkResponse[];
}

export interface AdminMasterListItemResponse extends MasterListItemResponse {
  email: string | null;
  phone: string | null;
  createdAt: string;
}
