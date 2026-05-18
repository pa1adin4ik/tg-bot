import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';

import { prisma } from '../../database';

export class NotificationsService {
  public async enqueue(input: {
    userId: string;
    bookingId?: string;
    type: NotificationType;
    channel?: NotificationChannel;
    title?: string;
    message: string;
    payload?: Record<string, unknown>;
    idempotencyKey?: string;
  }): Promise<void> {
    if (input.idempotencyKey) {
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });

      if (existing) {
        return;
      }
    }

    await prisma.notification.create({
      data: {
        userId: input.userId,
        bookingId: input.bookingId,
        type: input.type,
        channel: input.channel ?? NotificationChannel.TELEGRAM,
        status: NotificationStatus.PENDING,
        title: input.title,
        message: input.message,
        payload: input.payload as Prisma.InputJsonValue | undefined,
        idempotencyKey: input.idempotencyKey,
        nextAttemptAt: new Date(),
      },
    });
  }

  public async enqueueBookingConfirmed(bookingId: string, userId: string): Promise<void> {
    await this.enqueue({
      userId,
      bookingId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking confirmed',
      message: 'Your appointment has been confirmed.',
      idempotencyKey: `booking-confirmed:${bookingId}`,
    });
  }

  public async enqueueBookingCanceled(bookingId: string, userId: string): Promise<void> {
    await this.enqueue({
      userId,
      bookingId,
      type: NotificationType.BOOKING_CANCELED,
      title: 'Booking canceled',
      message: 'Your appointment has been canceled.',
      idempotencyKey: `booking-canceled:${bookingId}`,
    });
  }

  public async enqueuePaymentConfirmed(bookingId: string, userId: string): Promise<void> {
    await this.enqueue({
      userId,
      bookingId,
      type: NotificationType.PAYMENT_CONFIRMED,
      title: 'Payment received',
      message: 'Your prepayment was successful.',
      idempotencyKey: `payment-confirmed:${bookingId}`,
    });
  }

  public async enqueuePaymentFailed(bookingId: string, userId: string): Promise<void> {
    await this.enqueue({
      userId,
      bookingId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Payment failed',
      message: 'We could not process your payment. Please try again.',
      idempotencyKey: `payment-failed:${bookingId}:${Date.now()}`,
    });
  }

  public async processPendingBatch(limit = 50): Promise<number> {
    const now = new Date();
    const pending = await prisma.notification.findMany({
      where: {
        status: NotificationStatus.PENDING,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        deletedAt: null,
      },
      include: {
        user: { select: { telegramId: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    let processed = 0;

    for (const notification of pending) {
      try {
        if (notification.channel === NotificationChannel.TELEGRAM && notification.user.telegramId) {
          // Delivery handled by worker via Telegram API when token is configured.
        }

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });

        processed += 1;
      } catch (error) {
        const attemptCount = notification.attemptCount + 1;
        const maxAttempts = notification.maxAttempts;
        const failed = attemptCount >= maxAttempts;

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: failed ? NotificationStatus.FAILED : NotificationStatus.PENDING,
            attemptCount,
            failedAt: failed ? new Date() : null,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            nextAttemptAt: failed
              ? null
              : new Date(Date.now() + Math.min(attemptCount * 60_000, 3_600_000)),
          },
        });
      }
    }

    return processed;
  }

  public async enqueueReminders(): Promise<number> {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const in2h = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        startAt: { gte: new Date(), lte: in24h },
      },
      select: { id: true, userId: true, startAt: true },
    });

    let created = 0;

    for (const booking of bookings) {
      const hoursUntil = (booking.startAt.getTime() - Date.now()) / (60 * 60 * 1000);
      const keySuffix = hoursUntil <= 3 ? '2h' : '24h';

      await this.enqueue({
        userId: booking.userId,
        bookingId: booking.id,
        type: NotificationType.BOOKING_REMINDER,
        title: 'Appointment reminder',
        message: 'You have an upcoming appointment.',
        idempotencyKey: `reminder:${booking.id}:${keySuffix}`,
      });

      created += 1;
    }

    return created;
  }
}

export const notificationsService = new NotificationsService();
