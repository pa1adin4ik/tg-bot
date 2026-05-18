import { BookingStatus, TimeSlotStatus } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '../../database';

export const bookingQueries = {
  getBookingFlowContext(serviceId: string, masterId: string, dayStartUtc: Date, dayEndUtc: Date) {
    return prisma.service.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
        isActive: true,
        masters: {
          some: {
            id: masterId,
            deletedAt: null,
            isVisible: true,
          },
        },
      },
      select: {
        id: true,
        durationMinutes: true,
        price: true,
        currency: true,
        name: true,
        prepaymentRequired: true,
        prepaymentAmount: true,
        masters: {
          where: {
            id: masterId,
            deletedAt: null,
            isVisible: true,
          },
          select: {
            id: true,
            isVisible: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            schedules: {
              where: {
                deletedAt: null,
              },
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
            bookings: {
              where: {
                status: {
                  in: [
                    BookingStatus.PENDING,
                    BookingStatus.AWAITING_PREPAYMENT,
                    BookingStatus.CONFIRMED,
                    BookingStatus.IN_PROGRESS,
                  ],
                },
                startAt: {
                  lt: dayEndUtc,
                },
                endAt: {
                  gt: dayStartUtc,
                },
              },
              select: {
                id: true,
                startAt: true,
                endAt: true,
                status: true,
              },
            },
            timeSlots: {
              where: {
                deletedAt: null,
                startAt: {
                  lt: dayEndUtc,
                },
                endAt: {
                  gt: dayStartUtc,
                },
                status: {
                  in: [TimeSlotStatus.RESERVED, TimeSlotStatus.BOOKED],
                },
              },
              select: {
                id: true,
                startAt: true,
                endAt: true,
                status: true,
                reservedUntil: true,
              },
            },
          },
        },
      },
    });
  },

  getUserByTelegramId(telegramId: string) {
    return prisma.user.findFirst({
      where: {
        telegramId,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });
  },

  listUserBookings(userId: string) {
    return prisma.booking.findMany({
      where: {
        userId,
      },
      orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
        totalPrice: true,
        currency: true,
        prepaymentAmount: true,
        reservationExpiresAt: true,
        notes: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        master: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payments: {
          orderBy: [{ createdAt: 'desc' }],
          select: {
            status: true,
            expiresAt: true,
          },
        },
      },
    });
  },

  getBookingForUser(bookingId: string, telegramId: string) {
    return prisma.booking.findFirst({
      where: {
        id: bookingId,
        user: {
          telegramId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        userId: true,
        masterId: true,
        serviceId: true,
        timeSlotId: true,
        status: true,
        startAt: true,
        endAt: true,
        totalPrice: true,
        currency: true,
        prepaymentAmount: true,
        reservationExpiresAt: true,
        notes: true,
        master: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            schedules: {
              where: {
                deletedAt: null,
              },
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
            bookings: {
              where: {
                status: {
                  in: [
                    BookingStatus.PENDING,
                    BookingStatus.AWAITING_PREPAYMENT,
                    BookingStatus.CONFIRMED,
                    BookingStatus.IN_PROGRESS,
                  ],
                },
              },
              select: {
                id: true,
                startAt: true,
                endAt: true,
                status: true,
              },
            },
            timeSlots: {
              where: {
                deletedAt: null,
                status: {
                  in: [TimeSlotStatus.RESERVED, TimeSlotStatus.BOOKED],
                },
              },
              select: {
                id: true,
                startAt: true,
                endAt: true,
                status: true,
                reservedUntil: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
            currency: true,
            prepaymentRequired: true,
            prepaymentAmount: true,
          },
        },
        payments: {
          orderBy: [{ createdAt: 'desc' }],
          select: {
            id: true,
            status: true,
            expiresAt: true,
            kind: true,
          },
        },
      },
    });
  },
};
