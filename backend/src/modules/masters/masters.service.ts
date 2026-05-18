import {
  DayOfWeek,
  PortfolioMediaType,
  Prisma,
  ScheduleType,
} from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import { prisma } from '../../database';
import { schedulesService } from '../schedules/schedules.service';
import { masterQueries } from './masters.queries';
import type {
  AdminMasterListItemResponse,
  ListAdminMastersQuery,
  ListPublicMastersQuery,
  MasterDetailResponse,
  MasterListItemResponse,
  MasterScheduleInput,
  MasterScheduleResponse,
  PortfolioWorkInput,
  PortfolioWorkResponse,
  UpsertMasterInput,
} from './masters.types';

export class MastersService {
  public async listPublicMasters(
    query: ListPublicMastersQuery,
  ): Promise<MasterListItemResponse[]> {
    const masters = await masterQueries.listPublic(query);
    return masters.map((master) => this.mapMasterListItem(master));
  }

  public async getPublicMaster(masterId: string): Promise<MasterDetailResponse> {
    const master = await masterQueries.getPublicById(masterId);

    if (!master) {
      throw new AppError(404, 'MASTER_NOT_FOUND', 'Master profile was not found');
    }

    const mappedMaster = this.mapMasterDetail(master);

    return {
      ...mappedMaster,
      user: {
        ...mappedMaster.user,
        email: null,
        phone: null,
      },
    };
  }

  public async listAdminMasters(
    query: ListAdminMastersQuery,
  ): Promise<AdminMasterListItemResponse[]> {
    const masters = await masterQueries.listAdmin(query);

    return masters.map((master) => ({
      ...this.mapMasterListItem(master),
      email: master.user.email,
      phone: master.user.phone,
      createdAt: master.createdAt.toISOString(),
    }));
  }

  public async getAdminMaster(masterId: string): Promise<MasterDetailResponse> {
    const master = await masterQueries.getAdminById(masterId);

    if (!master) {
      throw new AppError(404, 'MASTER_NOT_FOUND', 'Master profile was not found');
    }

    return this.mapMasterDetail(master);
  }

  public async createMaster(input: UpsertMasterInput): Promise<MasterDetailResponse> {
    schedulesService.validate(input.schedules);
    await this.assertServicesExist(input.serviceIds);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email?.toLowerCase(),
          phone: input.phone,
          avatarUrl: input.avatarUrl,
        },
      });

      const master = await tx.master.create({
        data: {
          userId: user.id,
          bio: input.bio,
          experienceYears: input.experienceYears,
          isVisible: input.isVisible,
          services: {
            connect: input.serviceIds.map((serviceId) => ({ id: serviceId })),
          },
        },
      });

      await this.replaceSchedules(tx, master.id, input.schedules);
      await this.replacePortfolio(tx, master.id, input.portfolio);

      return master.id;
    });

    return this.getAdminMaster(result);
  }

  public async updateMaster(masterId: string, input: Partial<UpsertMasterInput>): Promise<MasterDetailResponse> {
    const existingMaster = await masterQueries.getAdminById(masterId);

    if (!existingMaster) {
      throw new AppError(404, 'MASTER_NOT_FOUND', 'Master profile was not found');
    }

    if (input.schedules) {
      schedulesService.validate(input.schedules);
    }

    if (input.serviceIds) {
      await this.assertServicesExist(input.serviceIds);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingMaster.user.id },
        data: {
          ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
          ...(input.email !== undefined ? { email: input.email?.toLowerCase() ?? null } : {}),
          ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
          ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl ?? null } : {}),
        },
      });

      await tx.master.update({
        where: { id: masterId },
        data: {
          ...(input.bio !== undefined ? { bio: input.bio ?? null } : {}),
          ...(input.experienceYears !== undefined
            ? { experienceYears: input.experienceYears ?? null }
            : {}),
          ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
          ...(input.serviceIds
            ? {
                services: {
                  set: input.serviceIds.map((serviceId) => ({ id: serviceId })),
                },
              }
            : {}),
        },
      });

      if (input.schedules) {
        await this.replaceSchedules(tx, masterId, input.schedules);
      }

      if (input.portfolio) {
        await this.replacePortfolio(tx, masterId, input.portfolio);
      }
    });

    return this.getAdminMaster(masterId);
  }

  public async deleteMaster(masterId: string): Promise<void> {
    const existingMaster = await masterQueries.getAdminById(masterId);

    if (!existingMaster) {
      throw new AppError(404, 'MASTER_NOT_FOUND', 'Master profile was not found');
    }

    const deletedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.schedule.updateMany({
        where: { masterId, deletedAt: null },
        data: { deletedAt },
      });

      await tx.portfolioWork.updateMany({
        where: { masterId, deletedAt: null },
        data: { deletedAt },
      });

      await tx.master.update({
        where: { id: masterId },
        data: { deletedAt, isVisible: false },
      });

      await tx.user.update({
        where: { id: existingMaster.user.id },
        data: { deletedAt },
      });
    });
  }

  private async assertServicesExist(serviceIds: string[]): Promise<void> {
    if (serviceIds.length === 0) {
      return;
    }

    const existingServices = await prisma.service.count({
      where: {
        id: {
          in: serviceIds,
        },
        deletedAt: null,
      },
    });

    if (existingServices !== new Set(serviceIds).size) {
      throw new AppError(400, 'INVALID_SERVICE_IDS', 'One or more serviceIds are invalid');
    }
  }

  private validateSchedules(schedules: MasterScheduleInput[]): void {
    for (const schedule of schedules) {
      if (schedule.startMinute >= schedule.endMinute) {
        throw new AppError(400, 'INVALID_SCHEDULE', 'Schedule endMinute must be greater than startMinute');
      }

      if (schedule.isRecurring && !schedule.dayOfWeek) {
        throw new AppError(400, 'INVALID_SCHEDULE', 'Recurring schedules require dayOfWeek');
      }

      if (!schedule.isRecurring && !schedule.specificDate) {
        throw new AppError(400, 'INVALID_SCHEDULE', 'Non-recurring schedules require specificDate');
      }

      if (schedule.validFrom && schedule.validTo && schedule.validFrom > schedule.validTo) {
        throw new AppError(400, 'INVALID_SCHEDULE', 'validTo must be on or after validFrom');
      }
    }
  }

  private async replaceSchedules(
    tx: Prisma.TransactionClient,
    masterId: string,
    schedules: MasterScheduleInput[],
  ): Promise<void> {
    const deletedAt = new Date();

    await tx.schedule.updateMany({
      where: {
        masterId,
        deletedAt: null,
      },
      data: {
        deletedAt,
      },
    });

    if (schedules.length === 0) {
      return;
    }

    await tx.schedule.createMany({
      data: schedules.map((schedule) => ({
        masterId,
        type: schedule.type,
        dayOfWeek: schedule.isRecurring ? schedule.dayOfWeek ?? null : null,
        specificDate: schedule.isRecurring ? null : new Date(schedule.specificDate!),
        startMinute: schedule.startMinute,
        endMinute: schedule.endMinute,
        timezone: schedule.timezone,
        isRecurring: schedule.isRecurring,
        isActive: schedule.isActive,
        validFrom: schedule.validFrom ? new Date(schedule.validFrom) : null,
        validTo: schedule.validTo ? new Date(schedule.validTo) : null,
      })),
    });
  }

  private async replacePortfolio(
    tx: Prisma.TransactionClient,
    masterId: string,
    portfolio: PortfolioWorkInput[],
  ): Promise<void> {
    const deletedAt = new Date();

    await tx.portfolioWork.updateMany({
      where: {
        masterId,
        deletedAt: null,
      },
      data: {
        deletedAt,
      },
    });

    if (portfolio.length === 0) {
      return;
    }

    await tx.portfolioWork.createMany({
      data: portfolio.map((item) => ({
        masterId,
        title: item.title,
        description: item.description,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        sortOrder: item.sortOrder,
        isPublished: item.isPublished,
      })),
    });
  }

  private mapMasterListItem(
    master: {
      id: string;
      bio: string | null;
      experienceYears: number | null;
      ratingAvg: Prisma.Decimal;
      reviewCount: number;
      isVisible: boolean;
      user: {
        firstName: string;
        lastName: string | null;
        avatarUrl: string | null;
      };
      services: Array<{ name: string }>;
    },
  ): MasterListItemResponse {
    return {
      id: master.id,
      fullName: [master.user.firstName, master.user.lastName].filter(Boolean).join(' '),
      avatarUrl: master.user.avatarUrl,
      bio: master.bio,
      experienceYears: master.experienceYears,
      ratingAvg: master.ratingAvg.toFixed(2),
      reviewCount: master.reviewCount,
      isVisible: master.isVisible,
      specializations: master.services.map((service) => service.name),
    };
  }

  private mapMasterDetail(
    master: {
      id: string;
      bio: string | null;
      experienceYears: number | null;
      ratingAvg: Prisma.Decimal;
      reviewCount: number;
      isVisible: boolean;
      user: {
        firstName: string;
        lastName: string | null;
        avatarUrl: string | null;
        email?: string | null;
        phone?: string | null;
      };
      services: Array<{ id: string; name: string; slug: string }>;
      schedules?: Array<{
        id: string;
        type: ScheduleType;
        dayOfWeek: DayOfWeek | null;
        specificDate: Date | null;
        startMinute: number;
        endMinute: number;
        timezone: string;
        isRecurring: boolean;
        isActive: boolean;
        validFrom: Date | null;
        validTo: Date | null;
      }>;
      portfolioWorks?: Array<{
        id: string;
        title: string;
        description: string | null;
        mediaUrl: string;
        mediaType: PortfolioMediaType;
        sortOrder: number;
        isPublished: boolean;
      }>;
    },
  ): MasterDetailResponse {
    return {
      ...this.mapMasterListItem(master),
      user: {
        firstName: master.user.firstName,
        lastName: master.user.lastName,
        email: master.user.email ?? null,
        phone: master.user.phone ?? null,
      },
      services: master.services.map((service) => ({
        id: service.id,
        name: service.name,
        slug: service.slug,
      })),
      schedules: (master.schedules ?? []).map((schedule): MasterScheduleResponse => ({
        id: schedule.id,
        type: schedule.type,
        dayOfWeek: schedule.dayOfWeek,
        specificDate: schedule.specificDate?.toISOString().slice(0, 10) ?? null,
        startMinute: schedule.startMinute,
        endMinute: schedule.endMinute,
        timezone: schedule.timezone,
        isRecurring: schedule.isRecurring,
        isActive: schedule.isActive,
        validFrom: schedule.validFrom?.toISOString().slice(0, 10) ?? null,
        validTo: schedule.validTo?.toISOString().slice(0, 10) ?? null,
      })),
      portfolio: (master.portfolioWorks ?? []).map((item): PortfolioWorkResponse => ({
        id: item.id,
        title: item.title,
        description: item.description,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        sortOrder: item.sortOrder,
        isPublished: item.isPublished,
      })),
    };
  }
}

export const mastersService = new MastersService();
