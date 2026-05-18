import { ScheduleType, type DayOfWeek } from '@prisma/client';

import { AppError } from '../../../common/errors/app-error';

export interface ScheduleIntervalInput {
  type: ScheduleType;
  dayOfWeek?: DayOfWeek | null;
  specificDate?: string | null;
  startMinute: number;
  endMinute: number;
  isRecurring: boolean;
  isActive: boolean;
  validFrom?: string | null;
  validTo?: string | null;
}

const overlapsMinutes = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean => {
  return aStart < bEnd && bStart < aEnd;
};

const scheduleKey = (schedule: ScheduleIntervalInput): string => {
  if (schedule.isRecurring) {
    return `recurring:${schedule.dayOfWeek ?? 'none'}`;
  }

  return `date:${schedule.specificDate ?? 'none'}`;
};

export const validateScheduleIntervals = (schedules: ScheduleIntervalInput[]): void => {
  for (const schedule of schedules) {
    if (schedule.startMinute < 0 || schedule.endMinute > 1440) {
      throw new AppError(400, 'INVALID_SCHEDULE', 'Schedule minutes must be within 0-1440');
    }

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

  const workingSchedules = schedules.filter(
    (schedule) => schedule.isActive && schedule.type === ScheduleType.WORKING_HOURS,
  );

  for (let index = 0; index < workingSchedules.length; index += 1) {
    for (let inner = index + 1; inner < workingSchedules.length; inner += 1) {
      const left = workingSchedules[index]!;
      const right = workingSchedules[inner]!;

      if (scheduleKey(left) !== scheduleKey(right)) {
        continue;
      }

      if (overlapsMinutes(left.startMinute, left.endMinute, right.startMinute, right.endMinute)) {
        throw new AppError(400, 'SCHEDULE_OVERLAP', 'Working hours overlap on the same day');
      }
    }
  }
};
