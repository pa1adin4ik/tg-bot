import { Prisma } from '@prisma/client';

import { prisma } from '../../database';
import type {
  ListServiceCategoriesQuery,
  ListServicesQuery,
} from './services.types';

const getServiceActiveFilter = (status: ListServicesQuery['status']): boolean | undefined => {
  switch (status) {
    case 'active':
      return true;
    case 'inactive':
      return false;
    default:
      return undefined;
  }
};

const getCategoryActiveFilter = (
  status: ListServiceCategoriesQuery['status'],
): boolean | undefined => {
  switch (status) {
    case 'active':
      return true;
    case 'inactive':
      return false;
    default:
      return undefined;
  }
};

export const serviceQueries = {
  listServices(query: ListServicesQuery) {
    const serviceActiveFilter = getServiceActiveFilter(query.status);

    return prisma.service.findMany({
      where: {
        deletedAt: null,
        ...(serviceActiveFilter === undefined ? {} : { isActive: serviceActiveFilter }),
        ...(query.categorySlug
          ? {
              category: {
                slug: query.categorySlug,
                deletedAt: null,
              },
            }
          : {}),
        ...(query.search
          ? {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  description: {
                    contains: query.search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        {
          category: {
            sortOrder: 'asc',
          },
        },
        {
          category: {
            name: 'asc',
          },
        },
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        durationMinutes: true,
        price: true,
        currency: true,
        prepaymentRequired: true,
        prepaymentAmount: true,
        isActive: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            deletedAt: true,
          },
        },
      },
    });
  },

  listCategories(query: ListServiceCategoriesQuery) {
    const categoryActiveFilter = getCategoryActiveFilter(query.status);
    const serviceActiveFilter = getServiceActiveFilter(query.status);

    return prisma.serviceCategory.findMany({
      where: {
        deletedAt: null,
        ...(categoryActiveFilter === undefined ? {} : { isActive: categoryActiveFilter }),
        ...(!query.includeEmpty
          ? {
              services: {
                some: {
                  deletedAt: null,
                  ...(serviceActiveFilter === undefined ? {} : { isActive: serviceActiveFilter }),
                },
              },
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            services: {
              where: {
                deletedAt: null,
                ...(serviceActiveFilter === undefined ? {} : { isActive: serviceActiveFilter }),
              },
            },
          },
        },
      },
    });
  },
};
