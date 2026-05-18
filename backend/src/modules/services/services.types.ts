import type { CurrencyCode } from '@prisma/client';

import type { ServiceStatusFilter } from './services.constants';

export interface ListServicesQuery {
  status: ServiceStatusFilter;
  categorySlug?: string;
  search?: string;
}

export interface ListServiceCategoriesQuery {
  status: ServiceStatusFilter;
  includeEmpty: boolean;
}

export interface ServiceCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  servicesCount?: number;
}

export interface ServiceResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  currency: CurrencyCode;
  prepaymentRequired: boolean;
  prepaymentAmount: string | null;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}
