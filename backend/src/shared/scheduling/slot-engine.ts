import {
  BookingStatus,
  DayOfWeek,
  ScheduleType,
  TimeSlotStatus,
  type Prisma,
} from '@prisma/client';
import { DateTime, Interval } from 'luxon';

import { bookingConfig } from '../../config';

export type MasterSlotContext = {
  service: {
    id: string;
    durationMinutes: number;
  };
  master: {
    id: string;
    isVisible: boolean;
  };
  schedules: Array<{
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
  bookings: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    status: BookingStatus;
  }>;
  timeSlots: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    status: TimeSlotStatus;
    reservedUntil: Date | null;
  }>;
};

export interface SlotCandidate {
  startAt: DateTime;
  endAt: DateTime;
  timezone: string;
}

const dayOfWeekMap: Record<string, DayOfWeek> = {
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
  7: DayOfWeek.SUNDAY,
};

const isDateWithinRange = (
  date: DateTime,
  validFrom: Date | null,
  validTo: Date | null,
  timezone: string,
): boolean => {
  const dateStart = date.startOf('day');

  if (validFrom) {
    const from = DateTime.fromJSDate(validFrom, { zone: timezone }).startOf('day');
    if (dateStart < from) {
      return false;
    }
  }

  if (validTo) {
    const to = DateTime.fromJSDate(validTo, { zone: timezone }).endOf('day');
    if (dateStart > to) {
      return false;
    }
  }

  return true;
};

const overlaps = (aStart: DateTime, aEnd: DateTime, bStart: DateTime, bEnd: DateTime): boolean => {
  return Interval.fromDateTimes(aStart, aEnd).overlaps(Interval.fromDateTimes(bStart, bEnd));
};

const isBlockedBySchedules = (
  candidateStart: DateTime,
  candidateEnd: DateTime,
  blockedSchedules: MasterSlotContext['schedules'],
): boolean => {
  return blockedSchedules.some((schedule) => {
    const scheduleStart = candidateStart.startOf('day').plus({ minutes: schedule.startMinute });
    const scheduleEnd = candidateStart.startOf('day').plus({ minutes: schedule.endMinute });

    return overlaps(candidateStart, candidateEnd, scheduleStart, scheduleEnd);
  });
};

const isOccupied = (
  candidateStart: DateTime,
  candidateEnd: DateTime,
  context: MasterSlotContext,
  excludeBookingId?: string,
): boolean => {
  const now = DateTime.utc();

  const bookedOverlap = context.bookings.some((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) {
      return false;
    }

    return overlaps(
      candidateStart.toUTC(),
      candidateEnd.toUTC(),
      DateTime.fromJSDate(booking.startAt),
      DateTime.fromJSDate(booking.endAt),
    );
  });

  if (bookedOverlap) {
    return true;
  }

  return context.timeSlots.some((slot) => {
    const slotStart = DateTime.fromJSDate(slot.startAt);
    const slotEnd = DateTime.fromJSDate(slot.endAt);
    const overlapsSlot = overlaps(candidateStart.toUTC(), candidateEnd.toUTC(), slotStart, slotEnd);

    if (!overlapsSlot) {
      return false;
    }

    if (slot.status === TimeSlotStatus.BOOKED) {
      return true;
    }

    if (slot.status === TimeSlotStatus.RESERVED && slot.reservedUntil) {
      return DateTime.fromJSDate(slot.reservedUntil) > now;
    }

    return false;
  });
};

export const getMasterTimezone = (schedules: MasterSlotContext['schedules']): string => {
  return schedules[0]?.timezone ?? 'UTC';
};

export const parseSlotStartAt = (isoString: string): DateTime => {
  const dateTime = DateTime.fromISO(isoString, { setZone: true });

  if (!dateTime.isValid) {
    throw new Error('Invalid slotStartAt');
  }

  return dateTime;
};

export const buildSlotCandidatesForDate = (
  context: MasterSlotContext,
  date: string,
  options: { excludeBookingId?: string } = {},
): SlotCandidate[] => {
  const timezone = getMasterTimezone(context.schedules);
  const targetDate = DateTime.fromISO(date, { zone: timezone }).startOf('day');
  const now = DateTime.now().setZone(timezone);
  const targetDayOfWeek = dayOfWeekMap[String(targetDate.weekday)];

  const workingSchedules = context.schedules.filter((schedule) => {
    if (!schedule.isActive || schedule.type !== ScheduleType.WORKING_HOURS) {
      return false;
    }

    if (!isDateWithinRange(targetDate, schedule.validFrom, schedule.validTo, timezone)) {
      return false;
    }

    if (schedule.isRecurring) {
      return schedule.dayOfWeek === targetDayOfWeek;
    }

    return schedule.specificDate !== null &&
      DateTime.fromJSDate(schedule.specificDate, { zone: timezone }).toISODate() === targetDate.toISODate();
  });

  const blockedSchedules = context.schedules.filter((schedule) => {
    if (!schedule.isActive || schedule.type !== ScheduleType.BLOCKED_TIME) {
      return false;
    }

    if (!isDateWithinRange(targetDate, schedule.validFrom, schedule.validTo, timezone)) {
      return false;
    }

    if (schedule.isRecurring) {
      return schedule.dayOfWeek === targetDayOfWeek;
    }

    return schedule.specificDate !== null &&
      DateTime.fromJSDate(schedule.specificDate, { zone: timezone }).toISODate() === targetDate.toISODate();
  });

  const candidates: SlotCandidate[] = [];
  const seenSlots = new Set<string>();

  for (const schedule of workingSchedules) {
    let minuteCursor = schedule.startMinute;
    const latestStartMinute = schedule.endMinute - context.service.durationMinutes;

    while (minuteCursor <= latestStartMinute) {
      const candidateStart = targetDate.plus({ minutes: minuteCursor });
      const candidateEnd = candidateStart.plus({ minutes: context.service.durationMinutes });

      if (candidateStart <= now) {
        minuteCursor += bookingConfig.slotIntervalMinutes;
        continue;
      }

      if (isBlockedBySchedules(candidateStart, candidateEnd, blockedSchedules)) {
        minuteCursor += bookingConfig.slotIntervalMinutes;
        continue;
      }

      if (isOccupied(candidateStart, candidateEnd, context, options.excludeBookingId)) {
        minuteCursor += bookingConfig.slotIntervalMinutes;
        continue;
      }

      const slotKey = `${candidateStart.toUTC().toISO()}-${candidateEnd.toUTC().toISO()}`;
      if (seenSlots.has(slotKey)) {
        minuteCursor += bookingConfig.slotIntervalMinutes;
        continue;
      }

      seenSlots.add(slotKey);

      candidates.push({
        startAt: candidateStart,
        endAt: candidateEnd,
        timezone,
      });

      minuteCursor += bookingConfig.slotIntervalMinutes;
    }
  }

  return candidates;
};

export const buildDateRange = (timezone: string) => {
  const start = DateTime.now().setZone(timezone).startOf('day');
  return Array.from({ length: bookingConfig.searchDays }, (_, index) => start.plus({ days: index }));
};

export const formatSlotLabel = (slot: SlotCandidate): string => {
  return `${slot.startAt.toFormat('HH:mm')} - ${slot.endAt.toFormat('HH:mm')}`;
};

export const formatDateLabel = (date: DateTime): string => {
  return date.toFormat('ccc, dd LLL');
};
