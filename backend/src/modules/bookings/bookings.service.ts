import {
  BookingStatus,
  CurrencyCode,
  PaymentStatus,
  Prisma,
  TimeSlotStatus,
  UserStatus,
} from '@prisma/client';
import { DateTime } from 'luxon';

import { AppError } from '../../common/errors/app-error';
import { bookingConfig, securityConfig } from '../../config';
import { prisma } from '../../database';
import { notificationsService } from '../notifications/notifications.service';
import { paymentsService } from '../payments/payments.service';
import { reservationsService } from './reservations.service';
import {
  buildDateRange,
  buildSlotCandidatesForDate,
  formatDateLabel,
  formatSlotLabel,
  getMasterTimezone,
  parseSlotStartAt,
  type MasterSlotContext,
} from './booking-slot.utils';
import { BOOKING_PAYMENT_OPTIONS, CANCELABLE_BOOKING_STATUSES } from './bookings.constants';
import { bookingQueries } from './bookings.queries';
import type {
  BookingDateOption,
  BookingSlotOption,
  BookingSummaryResponse,
  BookingDatesQuery,
  BookingSlotsQuery,
  CancelBookingInput,
  CreateBookingInput,
  ListUserBookingsParams,
  ListUserBookingsQuery,
  RescheduleBookingInput,
  RescheduleSlotsQuery,
  TelegramUserInput,
} from './bookings.types';

type PaymentSelection = (typeof BOOKING_PAYMENT_OPTIONS)[number];

export class BookingsService {
  public async listAvailableDates(query: BookingDatesQuery): Promise<BookingDateOption[]> {
    await reservationsService.expireStale();

    const initialContext = await this.getSlotGenerationContext(query.serviceId, query.masterId, DateTime.utc());
    const timezone = getMasterTimezone(initialContext.master.schedules);

    const dates = buildDateRange(timezone);
    const results: BookingDateOption[] = [];

    for (const date of dates) {
      const dailyContext = await this.getSlotGenerationContextForDateWithTimezone(
        query.serviceId,
        query.masterId,
        date.toISODate()!,
        timezone,
      );

      const slotCandidates = buildSlotCandidatesForDate(
        {
          service: dailyContext.service,
          master: { id: dailyContext.master.id, isVisible: dailyContext.master.isVisible },
          schedules: dailyContext.master.schedules,
          bookings: dailyContext.master.bookings,
          timeSlots: dailyContext.master.timeSlots,
        },
        date.toISODate()!,
      );

      if (slotCandidates.length > 0) {
        results.push({
          date: date.toISODate()!,
          label: formatDateLabel(date),
          availableSlotsCount: slotCandidates.length,
        });
      }
    }

    return results;
  }

  public async listAvailableSlots(query: BookingSlotsQuery): Promise<BookingSlotOption[]> {
    await reservationsService.expireStale();

    const context = await this.getSlotGenerationContextForDate(
      query.serviceId,
      query.masterId,
      query.date,
    );

    const candidates = buildSlotCandidatesForDate(this.toSlotContext(context), query.date);

    return candidates.map((slot) => ({
      startAt: slot.startAt.toUTC().toISO()!,
      endAt: slot.endAt.toUTC().toISO()!,
      label: formatSlotLabel(slot),
    }));
  }

  public async createBooking(input: CreateBookingInput): Promise<BookingSummaryResponse> {
    await reservationsService.expireStale();

    let slotStart: DateTime;

    try {
      slotStart = parseSlotStartAt(input.slotStartAt);
    } catch {
      throw new AppError(400, 'INVALID_SLOT', 'slotStartAt is invalid');
    }

    const initialContext = await this.getSlotGenerationContext(input.serviceId, input.masterId, DateTime.utc());
    const timezone = getMasterTimezone(initialContext.master.schedules);
    const date = slotStart.setZone(timezone).toISODate();

    if (!date) {
      throw new AppError(400, 'INVALID_SLOT', 'slotStartAt is invalid');
    }

    const context = await this.getSlotGenerationContextForDate(
      input.serviceId,
      input.masterId,
      date,
    );

    const candidate = buildSlotCandidatesForDate(this.toSlotContext(context), date).find(
      (slot) => slot.startAt.toUTC().toISO() === slotStart.toUTC().toISO(),
    );

    if (!candidate) {
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'Selected time slot is no longer available');
    }

    const paymentPlan = this.resolvePaymentPlan(
      input.paymentOption,
      context.service.prepaymentRequired,
      context.service.prepaymentAmount,
      context.service.price,
    );

    const reservationExpiresAt = paymentPlan.requiresReservation
      ? DateTime.utc().plus({ minutes: bookingConfig.reservationMinutes }).toJSDate()
      : null;

    const booking = await prisma.$transaction(async (tx) => {
      await reservationsService.acquireMasterLock(tx, input.masterId);

      const user = await this.upsertTelegramUser(tx, input.telegramUser);

      const activeReservations = await tx.booking.count({
        where: {
          userId: user.id,
          status: BookingStatus.AWAITING_PREPAYMENT,
        },
      });

      if (activeReservations >= securityConfig.maxActiveReservationsPerUser) {
        throw new AppError(
          429,
          'TOO_MANY_RESERVATIONS',
          'You have too many pending payment reservations',
        );
      }

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          masterId: input.masterId,
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.AWAITING_PREPAYMENT,
              BookingStatus.CONFIRMED,
              BookingStatus.IN_PROGRESS,
            ],
          },
          startAt: {
            lt: candidate.endAt.toUTC().toJSDate(),
          },
          endAt: {
            gt: candidate.startAt.toUTC().toJSDate(),
          },
        },
      });

      if (conflictingBooking) {
        throw new AppError(409, 'DOUBLE_BOOKING_BLOCKED', 'Selected slot has already been booked');
      }

      const timeSlotWhere = {
        masterId_startAt_endAt: {
          masterId: input.masterId,
          startAt: candidate.startAt.toUTC().toJSDate(),
          endAt: candidate.endAt.toUTC().toJSDate(),
        },
      } as const;

      const existingTimeSlot = await tx.timeSlot.findUnique({
        where: timeSlotWhere,
      });

      if (
        existingTimeSlot &&
        (existingTimeSlot.status === TimeSlotStatus.BOOKED ||
          (existingTimeSlot.status === TimeSlotStatus.RESERVED &&
            existingTimeSlot.reservedUntil &&
            existingTimeSlot.reservedUntil > new Date()))
      ) {
        throw new AppError(409, 'SLOT_UNAVAILABLE', 'Selected slot is no longer available');
      }

      const timeSlot = existingTimeSlot
        ? await tx.timeSlot.update({
            where: { id: existingTimeSlot.id },
            data: {
              status: paymentPlan.requiresReservation ? TimeSlotStatus.RESERVED : TimeSlotStatus.BOOKED,
              reservedUntil: reservationExpiresAt,
              deletedAt: null,
            },
          })
        : await tx.timeSlot.create({
            data: {
              masterId: input.masterId,
              status: paymentPlan.requiresReservation ? TimeSlotStatus.RESERVED : TimeSlotStatus.BOOKED,
              startAt: candidate.startAt.toUTC().toJSDate(),
              endAt: candidate.endAt.toUTC().toJSDate(),
              reservedUntil: reservationExpiresAt,
            },
          });

      const createdBooking = await tx.booking.create({
        data: {
          userId: user.id,
          masterId: input.masterId,
          serviceId: input.serviceId,
          timeSlotId: timeSlot.id,
          status: paymentPlan.requiresReservation
            ? BookingStatus.AWAITING_PREPAYMENT
            : BookingStatus.CONFIRMED,
          startAt: candidate.startAt.toUTC().toJSDate(),
          endAt: candidate.endAt.toUTC().toJSDate(),
          totalPrice: context.service.price,
          prepaymentAmount: paymentPlan.prepaymentAmount,
          currency: context.service.currency,
          notes: input.notes,
          reservationExpiresAt,
          confirmedAt: paymentPlan.requiresReservation ? null : new Date(),
        },
        include: {
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
        },
      });

      let paymentStatus: PaymentStatus | null = null;
      let paymentExpiresAt: Date | null = null;

      if (paymentPlan.requiresReservation && reservationExpiresAt) {
        const payment = await paymentsService.reserveForBooking(tx, {
          bookingId: createdBooking.id,
          userId: user.id,
          amount: paymentPlan.prepaymentAmount ?? context.service.price,
          totalPrice: context.service.price,
          currency: context.service.currency,
          expiresAt: reservationExpiresAt,
          paymentOption: input.paymentOption,
        });

        paymentStatus = payment.status;
        paymentExpiresAt = payment.expiresAt;
      }

      return this.mapBookingSummary({
        id: createdBooking.id,
        status: createdBooking.status,
        startAt: createdBooking.startAt,
        endAt: createdBooking.endAt,
        totalPrice: createdBooking.totalPrice,
        currency: createdBooking.currency,
        prepaymentAmount: createdBooking.prepaymentAmount,
        reservationExpiresAt: createdBooking.reservationExpiresAt,
        notes: createdBooking.notes,
        service: createdBooking.service,
        master: createdBooking.master,
        paymentStatus,
        paymentExpiresAt,
      });
    });

    return booking;
  }

  public async listUserBookings(
    params: ListUserBookingsParams,
    query: ListUserBookingsQuery,
  ): Promise<BookingSummaryResponse[]> {
    await reservationsService.expireStale();

    const user = await bookingQueries.getUserByTelegramId(params.telegramId);

    if (!user) {
      return [];
    }

    const now = DateTime.utc();
    const bookings = await bookingQueries.listUserBookings(user.id);

    return bookings
      .filter((booking) => {
        const bookingStart = DateTime.fromJSDate(booking.startAt);

        if (query.scope === 'upcoming') {
          return (
            bookingStart >= now &&
            booking.status !== BookingStatus.CANCELED &&
            booking.status !== BookingStatus.EXPIRED &&
            booking.status !== BookingStatus.COMPLETED
          );
        }

        if (query.scope === 'completed') {
          return booking.status === BookingStatus.COMPLETED || bookingStart < now;
        }

        if (query.scope === 'cancelled') {
          return booking.status === BookingStatus.CANCELED || booking.status === BookingStatus.EXPIRED;
        }

        if (query.scope === 'history') {
          return bookingStart < now || booking.status === BookingStatus.CANCELED;
        }

        return true;
      })
      .map((booking) =>
        this.mapBookingSummary({
          ...booking,
          master: booking.master,
          paymentStatus: booking.payments[0]?.status ?? null,
          paymentExpiresAt: booking.payments[0]?.expiresAt ?? null,
        }),
      );
  }

  public async cancelBooking(
    bookingId: string,
    input: CancelBookingInput,
  ): Promise<BookingSummaryResponse> {
    await reservationsService.expireStale();

    const booking = await bookingQueries.getBookingForUser(bookingId, input.telegramId);

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }

    if (!(CANCELABLE_BOOKING_STATUSES as readonly BookingStatus[]).includes(booking.status)) {
      throw new AppError(400, 'BOOKING_NOT_CANCELABLE', 'Booking cannot be canceled');
    }

    if (DateTime.fromJSDate(booking.startAt) <= DateTime.utc()) {
      throw new AppError(400, 'BOOKING_ALREADY_STARTED', 'Past or started bookings cannot be canceled');
    }

    const canceledBooking = await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELED,
          cancelReason: input.reason,
          canceledAt: new Date(),
          reservationExpiresAt: null,
        },
      });

      if (booking.timeSlotId) {
        await tx.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: {
            status: TimeSlotStatus.AVAILABLE,
            reservedUntil: null,
          },
        });
      }

      await tx.payment.updateMany({
        where: {
          bookingId: booking.id,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.RESERVED],
          },
        },
        data: {
          status: PaymentStatus.CANCELED,
        },
      });

      const refreshed = await bookingQueries.getBookingForUser(booking.id, input.telegramId);

      if (!refreshed) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
      }

      return refreshed;
    });

    await notificationsService.enqueueBookingCanceled(booking.id, booking.userId);

    return this.mapBookingSummary({
      ...canceledBooking,
      master: canceledBooking.master,
      paymentStatus: canceledBooking.payments[0]?.status ?? null,
      paymentExpiresAt: canceledBooking.payments[0]?.expiresAt ?? null,
    });
  }

  public async getBookingById(
    bookingId: string,
    telegramId: string,
  ): Promise<BookingSummaryResponse> {
    await reservationsService.expireStale();

    const booking = await bookingQueries.getBookingForUser(bookingId, telegramId);

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }

    return this.mapBookingSummary({
      ...booking,
      master: booking.master,
      paymentStatus: booking.payments[0]?.status ?? null,
      paymentExpiresAt: booking.payments[0]?.expiresAt ?? null,
    });
  }

  public async listAdminBookings(query: {
    page: number;
    limit: number;
    status?: BookingStatus;
    q?: string;
    masterId?: string;
    serviceId?: string;
    from?: string;
    to?: string;
  }) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.masterId ? { masterId: query.masterId } : {}),
      ...(query.serviceId ? { serviceId: query.serviceId } : {}),
      ...(query.from || query.to
        ? {
            startAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { id: query.q },
              { user: { firstName: { contains: query.q, mode: 'insensitive' } } },
              { user: { lastName: { contains: query.q, mode: 'insensitive' } } },
              { user: { telegramId: { contains: query.q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { startAt: 'desc' },
        include: {
          service: { select: { id: true, name: true } },
          master: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          user: { select: { firstName: true, lastName: true, telegramId: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      items: items.map((booking) =>
        this.mapBookingSummary({
          id: booking.id,
          status: booking.status,
          startAt: booking.startAt,
          endAt: booking.endAt,
          totalPrice: booking.totalPrice,
          currency: booking.currency,
          prepaymentAmount: booking.prepaymentAmount,
          reservationExpiresAt: booking.reservationExpiresAt,
          notes: booking.notes,
          service: booking.service,
          master: booking.master,
          paymentStatus: booking.payments[0]?.status ?? null,
          paymentExpiresAt: booking.payments[0]?.expiresAt ?? null,
        }),
      ),
      total,
    };
  }

  public async updateAdminBookingStatus(bookingId: string, status: BookingStatus) {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        service: { select: { id: true, name: true } },
        master: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    return this.mapBookingSummary({
      id: booking.id,
      status: booking.status,
      startAt: booking.startAt,
      endAt: booking.endAt,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      prepaymentAmount: booking.prepaymentAmount,
      reservationExpiresAt: booking.reservationExpiresAt,
      notes: booking.notes,
      service: booking.service,
      master: booking.master,
      paymentStatus: booking.payments[0]?.status ?? null,
      paymentExpiresAt: booking.payments[0]?.expiresAt ?? null,
    });
  }

  public async adminCancelBooking(bookingId: string, reason?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELED,
          cancelReason: reason,
          canceledAt: new Date(),
          reservationExpiresAt: null,
        },
      });

      if (booking.timeSlotId) {
        await tx.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { status: TimeSlotStatus.AVAILABLE, reservedUntil: null },
        });
      }

      await tx.payment.updateMany({
        where: {
          bookingId: booking.id,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.RESERVED] },
        },
        data: { status: PaymentStatus.CANCELED },
      });
    });

    await notificationsService.enqueueBookingCanceled(booking.id, booking.userId);

    const refreshed = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { id: true, name: true } },
        master: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!refreshed) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }

    return this.mapBookingSummary({
      id: refreshed.id,
      status: refreshed.status,
      startAt: refreshed.startAt,
      endAt: refreshed.endAt,
      totalPrice: refreshed.totalPrice,
      currency: refreshed.currency,
      prepaymentAmount: refreshed.prepaymentAmount,
      reservationExpiresAt: refreshed.reservationExpiresAt,
      notes: refreshed.notes,
      service: refreshed.service,
      master: refreshed.master,
      paymentStatus: refreshed.payments[0]?.status ?? null,
      paymentExpiresAt: refreshed.payments[0]?.expiresAt ?? null,
    });
  }

  public async listRescheduleSlots(
    bookingId: string,
    telegramId: string,
    query: RescheduleSlotsQuery,
  ): Promise<BookingSlotOption[]> {
    await reservationsService.expireStale();

    const booking = await bookingQueries.getBookingForUser(bookingId, telegramId);

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }

    if (!(CANCELABLE_BOOKING_STATUSES as readonly BookingStatus[]).includes(booking.status)) {
      throw new AppError(400, 'BOOKING_NOT_RESCHEDULABLE', 'Booking cannot be rescheduled');
    }

    const context = await this.getSlotGenerationContextForDate(
      booking.serviceId,
      booking.masterId,
      query.date,
    );

    const candidates = buildSlotCandidatesForDate(this.toSlotContext(context), query.date, {
      excludeBookingId: booking.id,
    });

    return candidates.map((slot) => ({
      startAt: slot.startAt.toUTC().toISO()!,
      endAt: slot.endAt.toUTC().toISO()!,
      label: formatSlotLabel(slot),
    }));
  }

  public async rescheduleBooking(
    bookingId: string,
    input: RescheduleBookingInput,
  ): Promise<BookingSummaryResponse> {
    await reservationsService.expireStale();

    const booking = await bookingQueries.getBookingForUser(bookingId, input.telegramId);

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
    }

    if (!(CANCELABLE_BOOKING_STATUSES as readonly BookingStatus[]).includes(booking.status)) {
      throw new AppError(400, 'BOOKING_NOT_RESCHEDULABLE', 'Booking cannot be rescheduled');
    }

    let slotStart: DateTime;

    try {
      slotStart = parseSlotStartAt(input.slotStartAt);
    } catch {
      throw new AppError(400, 'INVALID_SLOT', 'slotStartAt is invalid');
    }
    const date = slotStart.setZone(getMasterTimezone(booking.master.schedules)).toISODate();

    if (!date) {
      throw new AppError(400, 'INVALID_SLOT', 'slotStartAt is invalid');
    }

    const context = await this.getSlotGenerationContextForDate(
      booking.serviceId,
      booking.masterId,
      date,
    );

    const candidate = buildSlotCandidatesForDate(this.toSlotContext(context), date, {
      excludeBookingId: booking.id,
    }).find((slot) => slot.startAt.toUTC().toISO() === slotStart.toUTC().toISO());

    if (!candidate) {
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'Selected reschedule slot is no longer available');
    }

    const reservationExpiresAt =
      booking.status === BookingStatus.AWAITING_PREPAYMENT
        ? DateTime.utc().plus({ minutes: bookingConfig.reservationMinutes }).toJSDate()
        : null;

    const rescheduledBooking = await prisma.$transaction(async (tx) => {
      if (booking.timeSlotId) {
        await tx.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: {
            status: TimeSlotStatus.AVAILABLE,
            reservedUntil: null,
          },
        });
      }

      const nextSlotWhere = {
        masterId_startAt_endAt: {
          masterId: booking.masterId,
          startAt: candidate.startAt.toUTC().toJSDate(),
          endAt: candidate.endAt.toUTC().toJSDate(),
        },
      } as const;

      const existingNextSlot = await tx.timeSlot.findUnique({
        where: nextSlotWhere,
      });

      if (
        existingNextSlot &&
        (existingNextSlot.status === TimeSlotStatus.BOOKED ||
          (existingNextSlot.status === TimeSlotStatus.RESERVED &&
            existingNextSlot.reservedUntil &&
            existingNextSlot.reservedUntil > new Date()))
      ) {
        throw new AppError(409, 'SLOT_UNAVAILABLE', 'Selected reschedule slot is no longer available');
      }

      const nextSlot = existingNextSlot
        ? await tx.timeSlot.update({
            where: { id: existingNextSlot.id },
            data: {
              status:
                booking.status === BookingStatus.AWAITING_PREPAYMENT
                  ? TimeSlotStatus.RESERVED
                  : TimeSlotStatus.BOOKED,
              reservedUntil: reservationExpiresAt,
              deletedAt: null,
            },
          })
        : await tx.timeSlot.create({
            data: {
              masterId: booking.masterId,
              startAt: candidate.startAt.toUTC().toJSDate(),
              endAt: candidate.endAt.toUTC().toJSDate(),
              status:
                booking.status === BookingStatus.AWAITING_PREPAYMENT
                  ? TimeSlotStatus.RESERVED
                  : TimeSlotStatus.BOOKED,
              reservedUntil: reservationExpiresAt,
            },
          });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          startAt: candidate.startAt.toUTC().toJSDate(),
          endAt: candidate.endAt.toUTC().toJSDate(),
          timeSlotId: nextSlot.id,
          reservationExpiresAt,
        },
      });

      if (booking.status === BookingStatus.AWAITING_PREPAYMENT) {
        await tx.payment.updateMany({
          where: {
            bookingId: booking.id,
            status: {
              in: [PaymentStatus.PENDING, PaymentStatus.RESERVED],
            },
          },
          data: {
            status: PaymentStatus.RESERVED,
            expiresAt: reservationExpiresAt,
          },
        });
      }

      const refreshed = await bookingQueries.getBookingForUser(booking.id, input.telegramId);

      if (!refreshed) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking was not found');
      }

      return refreshed;
    });

    return this.mapBookingSummary({
      ...rescheduledBooking,
      master: rescheduledBooking.master,
      paymentStatus: rescheduledBooking.payments[0]?.status ?? null,
      paymentExpiresAt: rescheduledBooking.payments[0]?.expiresAt ?? null,
    });
  }

  private async getSlotGenerationContext(serviceId: string, masterId: string, baseDateUtc: DateTime) {
    const dayStartUtc = baseDateUtc.startOf('day').toJSDate();
    const dayEndUtc = baseDateUtc.endOf('day').toJSDate();
    const context = await bookingQueries.getBookingFlowContext(serviceId, masterId, dayStartUtc, dayEndUtc);

    if (!context || context.masters.length === 0) {
      throw new AppError(404, 'BOOKING_CONTEXT_NOT_FOUND', 'Service or master was not found');
    }

    return {
      service: context,
      master: context.masters[0]!,
    };
  }

  private async getSlotGenerationContextForDate(serviceId: string, masterId: string, date: string) {
    const initial = await this.getSlotGenerationContext(serviceId, masterId, DateTime.utc());
    const timezone = getMasterTimezone(initial.master.schedules);

    return this.getSlotGenerationContextForDateWithTimezone(serviceId, masterId, date, timezone);
  }

  private async getSlotGenerationContextForDateWithTimezone(
    serviceId: string,
    masterId: string,
    date: string,
    timezone: string,
  ) {
    const targetDate = DateTime.fromISO(date, { zone: timezone });

    if (!targetDate.isValid) {
      throw new AppError(400, 'INVALID_DATE', 'date is invalid');
    }

    const dayStartUtc = targetDate.startOf('day').toUTC().toJSDate();
    const dayEndUtc = targetDate.endOf('day').toUTC().toJSDate();
    const context = await bookingQueries.getBookingFlowContext(serviceId, masterId, dayStartUtc, dayEndUtc);

    if (!context || context.masters.length === 0) {
      throw new AppError(404, 'BOOKING_CONTEXT_NOT_FOUND', 'Service or master was not found');
    }

    return {
      service: context,
      master: context.masters[0]!,
    };
  }

  private toSlotContext(context: {
    service: { id: string; durationMinutes: number };
    master?: {
      id: string;
      isVisible: boolean;
      schedules: MasterSlotContext['schedules'];
      bookings: MasterSlotContext['bookings'];
      timeSlots: MasterSlotContext['timeSlots'];
    };
  }): MasterSlotContext {
    if (!context.master) {
      throw new AppError(404, 'BOOKING_CONTEXT_NOT_FOUND', 'Master was not found');
    }

    return {
      service: {
        id: context.service.id,
        durationMinutes: context.service.durationMinutes,
      },
      master: {
        id: context.master.id,
        isVisible: context.master.isVisible,
      },
      schedules: context.master.schedules,
      bookings: context.master.bookings,
      timeSlots: context.master.timeSlots,
    };
  }

  private resolvePaymentPlan(
    paymentOption: PaymentSelection,
    prepaymentRequired: boolean,
    prepaymentAmount: Prisma.Decimal | null,
    totalPrice: Prisma.Decimal,
  ) {
    if (prepaymentRequired && paymentOption === 'AT_VENUE') {
      throw new AppError(
        400,
        'PREPAYMENT_REQUIRED',
        'This service requires prepayment before confirmation',
      );
    }

    if (paymentOption === 'PREPAY_NOW') {
      return {
        requiresReservation: true,
        prepaymentAmount: prepaymentAmount ?? totalPrice,
      };
    }

    return {
      requiresReservation: false,
      prepaymentAmount: null,
    };
  }

  private async upsertTelegramUser(
    tx: Prisma.TransactionClient,
    telegramUser: TelegramUserInput,
  ) {
    const existingUser = await tx.user.findFirst({
      where: {
        telegramId: telegramUser.telegramId,
      },
    });

    if (existingUser) {
      if (existingUser.status !== UserStatus.ACTIVE || existingUser.deletedAt) {
        throw new AppError(403, 'USER_BLOCKED', 'This Telegram user cannot create bookings');
      }

      return tx.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName,
          username: telegramUser.username,
          lastSeenAt: new Date(),
        },
      });
    }

    return tx.user.create({
      data: {
        telegramId: telegramUser.telegramId,
        firstName: telegramUser.firstName,
        lastName: telegramUser.lastName,
        username: telegramUser.username,
        lastSeenAt: new Date(),
      },
    });
  }

  private mapBookingSummary(input: {
    id: string;
    status: BookingStatus;
    startAt: Date;
    endAt: Date;
    totalPrice: Prisma.Decimal;
    currency: CurrencyCode;
    prepaymentAmount: Prisma.Decimal | null;
    reservationExpiresAt: Date | null;
    notes: string | null;
    service: {
      id: string;
      name: string;
    };
    master: {
      id: string;
      user: {
        firstName: string;
        lastName: string | null;
      };
    };
    paymentStatus: PaymentStatus | null;
    paymentExpiresAt: Date | null;
  }): BookingSummaryResponse {
    return {
      id: input.id,
      status: input.status,
      service: input.service,
      master: {
        id: input.master.id,
        fullName: [input.master.user.firstName, input.master.user.lastName]
          .filter(Boolean)
          .join(' '),
      },
      startAt: input.startAt.toISOString(),
      endAt: input.endAt.toISOString(),
      totalPrice: input.totalPrice.toFixed(2),
      currency: input.currency,
      prepaymentAmount: input.prepaymentAmount ? input.prepaymentAmount.toFixed(2) : null,
      paymentStatus: input.paymentStatus,
      paymentExpiresAt: input.paymentExpiresAt?.toISOString() ?? null,
      reservationExpiresAt: input.reservationExpiresAt?.toISOString() ?? null,
      notes: input.notes,
    };
  }
}

export const bookingsService = new BookingsService();
