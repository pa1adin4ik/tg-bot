import { PortfolioMediaType } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import { prisma } from '../../database';

export interface PortfolioWorkResponse {
  id: string;
  masterId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  caption: string | null;
  mediaUrl: string;
  mediaType: PortfolioMediaType;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
}

export class PortfolioService {
  public async listPublicByMaster(masterId: string, featuredOnly = false): Promise<PortfolioWorkResponse[]> {
    const works = await prisma.portfolioWork.findMany({
      where: {
        masterId,
        isPublished: true,
        deletedAt: null,
        ...(featuredOnly ? { isFeatured: true } : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return works.map((work) => this.mapWork(work));
  }

  public async listCategories() {
    return prisma.portfolioCategory.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  public async upsertWork(
    masterId: string,
    input: {
      id?: string;
      title: string;
      description?: string;
      caption?: string;
      mediaUrl: string;
      mediaType: PortfolioMediaType;
      categoryId?: string;
      sortOrder?: number;
      isFeatured?: boolean;
      isPublished?: boolean;
    },
  ): Promise<PortfolioWorkResponse> {
    if (input.id) {
      const updated = await prisma.portfolioWork.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description ?? null,
          caption: input.caption ?? null,
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType,
          categoryId: input.categoryId ?? null,
          sortOrder: input.sortOrder ?? 0,
          isFeatured: input.isFeatured ?? false,
          isPublished: input.isPublished ?? true,
        },
      });

      return this.mapWork(updated);
    }

    const created = await prisma.portfolioWork.create({
      data: {
        masterId,
        title: input.title,
        description: input.description ?? null,
        caption: input.caption ?? null,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        categoryId: input.categoryId ?? null,
        sortOrder: input.sortOrder ?? 0,
        isFeatured: input.isFeatured ?? false,
        isPublished: input.isPublished ?? true,
      },
    });

    return this.mapWork(created);
  }

  public async deleteWork(workId: string): Promise<void> {
    const work = await prisma.portfolioWork.findFirst({ where: { id: workId, deletedAt: null } });
    if (!work) {
      throw new AppError(404, 'PORTFOLIO_WORK_NOT_FOUND', 'Portfolio work was not found');
    }

    await prisma.portfolioWork.update({
      where: { id: workId },
      data: { deletedAt: new Date() },
    });
  }

  private mapWork(work: {
    id: string;
    masterId: string;
    categoryId: string | null;
    title: string;
    description: string | null;
    caption: string | null;
    mediaUrl: string;
    mediaType: PortfolioMediaType;
    sortOrder: number;
    isFeatured: boolean;
    isPublished: boolean;
  }): PortfolioWorkResponse {
    return {
      id: work.id,
      masterId: work.masterId,
      categoryId: work.categoryId,
      title: work.title,
      description: work.description,
      caption: work.caption,
      mediaUrl: work.mediaUrl,
      mediaType: work.mediaType,
      sortOrder: work.sortOrder,
      isFeatured: work.isFeatured,
      isPublished: work.isPublished,
    };
  }
}

export const portfolioService = new PortfolioService();
