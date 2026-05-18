import { ScheduleType } from '@prisma/client';

import { validateScheduleIntervals } from '../src/modules/schedules/validation/schedule-conflict.validator';

describe('validateScheduleIntervals', () => {
  it('rejects overlapping working hours on the same day', () => {
    expect(() =>
      validateScheduleIntervals([
        {
          type: ScheduleType.WORKING_HOURS,
          dayOfWeek: 'MONDAY',
          startMinute: 540,
          endMinute: 720,
          isRecurring: true,
          isActive: true,
        },
        {
          type: ScheduleType.WORKING_HOURS,
          dayOfWeek: 'MONDAY',
          startMinute: 660,
          endMinute: 900,
          isRecurring: true,
          isActive: true,
        },
      ]),
    ).toThrow('Working hours overlap');
  });

  it('accepts non-overlapping working hours', () => {
    expect(() =>
      validateScheduleIntervals([
        {
          type: ScheduleType.WORKING_HOURS,
          dayOfWeek: 'MONDAY',
          startMinute: 540,
          endMinute: 720,
          isRecurring: true,
          isActive: true,
        },
        {
          type: ScheduleType.WORKING_HOURS,
          dayOfWeek: 'TUESDAY',
          startMinute: 540,
          endMinute: 720,
          isRecurring: true,
          isActive: true,
        },
      ]),
    ).not.toThrow();
  });
});
