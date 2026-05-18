import { ScheduleType, type DayOfWeek } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import { prisma } from '../../database';
import {
  validateScheduleIntervals,
  type ScheduleIntervalInput,
} from './validation/schedule-conflict.validator';

export interface ScheduleResponse {
  id: string;
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

export interface UpsertScheduleInput extends ScheduleIntervalInput {
  timezone: string;
}

export class SchedulesService {
  public async listByMaster(masterId: string): Promise<ScheduleResponse[]> {
    const schedules = await prisma.schedule.findMany({
      where: { masterId, deletedAt: null },
      orderBy: [{ isRecurring: 'desc' }, { dayOfWeek: 'asc' }, { specificDate: 'asc' }],
    });

    return schedules.map((schedule) => this.mapSchedule(schedule));
  }

  public async replaceForMaster(masterId: string, schedules: UpsertScheduleInput[]): Promise<ScheduleResponse[]> {
    validateScheduleIntervals(schedules);

    await prisma.$transaction(async (tx) => {
      await tx.schedule.updateMany({
        where: { masterId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      if (schedules.length > 0) {
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
    });

    return this.listByMaster(masterId);
  }

  public validate(schedules: ScheduleIntervalInput[]): void {
    validateScheduleIntervals(schedules);
  }

  private mapSchedule(schedule: {
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
  }): ScheduleResponse {
    return {
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
    };
  }
}

export const schedulesService = new SchedulesService();
