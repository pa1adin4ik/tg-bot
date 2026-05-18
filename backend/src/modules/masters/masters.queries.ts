import { Prisma } from '@prisma/client';

import { prisma } from '../../database';
import type { ListAdminMastersQuery, ListPublicMastersQuery } from './masters.types';

const buildSearchWhere = (search?: string): Prisma.MasterWhereInput | undefined => {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      {
        user: {
          firstName: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        user: {
          lastName: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        services: {
          some: {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
            deletedAt: null,
          },
        },
      },
    ],
  };
};

export const masterQueries = {
  listPublic(query: ListPublicMastersQuery) {
    return prisma.master.findMany({
      where: {
        deletedAt: null,
        isVisible: true,
        user: {
          deletedAt: null,
        },
        ...(query.serviceSlug
          ? {
              services: {
                some: {
                  slug: query.serviceSlug,
                  deletedAt: null,
                  isActive: true,
                },
              },
            }
          : {}),
        ...(buildSearchWhere(query.search) ?? {}),
      },
      orderBy: [{ ratingAvg: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        bio: true,
        experienceYears: true,
        ratingAvg: true,
        reviewCount: true,
        isVisible: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true,
          },
        },
        services: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  },

  getPublicById(masterId: string) {
    return prisma.master.findFirst({
      where: {
        id: masterId,
        deletedAt: null,
        isVisible: true,
        user: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        bio: true,
        experienceYears: true,
        ratingAvg: true,
        reviewCount: true,
        isVisible: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true,
          },
        },
        services: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        schedules: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }, { specificDate: 'asc' }],
          select: {
            id: true,
            type: true,
            dayOfWeek: true,
            specificDate: true,
            startMinute: true,
            endMinute: true,
            timezone: true,
            isRecurring: true,
            isActive: true,
            validFrom: true,
            validTo: true,
          },
        },
        portfolioWorks: {
          where: {
            deletedAt: null,
            isPublished: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            description: true,
            mediaUrl: true,
            mediaType: true,
            sortOrder: true,
            isPublished: true,
          },
        },
      },
    });
  },

  listAdmin(query: ListAdminMastersQuery) {
    return prisma.master.findMany({
      where: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
        ...(query.visibility === 'visible'
          ? { isVisible: true }
          : query.visibility === 'hidden'
            ? { isVisible: false }
            : {}),
        ...(buildSearchWhere(query.search) ?? {}),
      },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        bio: true,
        experienceYears: true,
        ratingAvg: true,
        reviewCount: true,
        isVisible: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true,
          },
        },
        services: {
          where: {
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  },

  getAdminById(masterId: string) {
    return prisma.master.findFirst({
      where: {
        id: masterId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        bio: true,
        experienceYears: true,
        ratingAvg: true,
        reviewCount: true,
        isVisible: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true,
          },
        },
        services: {
          where: {
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        schedules: {
          where: {
            deletedAt: null,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }, { specificDate: 'asc' }],
          select: {
            id: true,
            type: true,
            dayOfWeek: true,
            specificDate: true,
            startMinute: true,
            endMinute: true,
            timezone: true,
            isRecurring: true,
            isActive: true,
            validFrom: true,
            validTo: true,
          },
        },
        portfolioWorks: {
          where: {
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            description: true,
            mediaUrl: true,
            mediaType: true,
            sortOrder: true,
            isPublished: true,
          },
        },
      },
    });
  },
};
