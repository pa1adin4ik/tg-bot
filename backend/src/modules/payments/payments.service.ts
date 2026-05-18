import {
  BookingStatus,
  PaymentKind,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TimeSlotStatus,
  type CurrencyCode,
} from '@prisma/client';
import { DateTime } from 'luxon';

import { AppError } from '../../common/errors/app-error';
import { bookingConfig, paymentConfig } from '../../config';
import { prisma } from '../../database';
import { notificationsService } from '../notifications/notifications.service';
import { mockPaymentProvider } from './providers/mock-payment.provider';
import type { PaymentSummaryResponse } from './payments.types';

export class PaymentsService {
  public async reserveForBooking(
    tx: Prisma.TransactionClient,
    input: {
      bookingId: string;
      userId: string;
      amount: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
      currency: CurrencyCode;
      expiresAt: Date;
      paymentOption: string;
    },
  ) {
    const kind =
      input.amount.lessThan(input.totalPrice) ? PaymentKind.PREPAYMENT : PaymentKind.FULL;

    return tx.payment.create({
      data: {
        bookingId: input.bookingId,
        userId: input.userId,
        kind,
        method: PaymentMethod.ONLINE,
        status: PaymentStatus.RESERVED,
        amount: input.amount,
        currency: input.currency,
        reservedAt: new Date(),
        expiresAt: input.expiresAt,
        metadata: { paymentOption: input.paymentOption },
      },
    });
  }

  public async initiatePayment(paymentId: string, telegramId: string): Promise<PaymentSummaryResponse> {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        user: { telegramId },
        status: { in: [PaymentStatus.PENDING, PaymentStatus.RESERVED, PaymentStatus.FAILED] },
      },
    });

    if (!payment) {
      throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment was not found');
    }

    if (payment.expiresAt && payment.expiresAt < new Date()) {
      throw new AppError(400, 'PAYMENT_EXPIRED', 'Payment session has expired');
    }

    const session = await mockPaymentProvider.createSession({
      paymentId: payment.id,
      amount: payment.amount.toFixed(2),
      currency: payment.currency,
    });

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalReference: session.externalReference,
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
          checkoutUrl: session.checkoutUrl,
        },
      },
    });

    return this.mapPayment(updated, session.checkoutUrl);
  }

  public async confirmPayment(paymentId: string, telegramId: string): Promise<PaymentSummaryResponse> {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        user: { telegramId },
      },
      include: {
        booking: { select: { id: true, timeSlotId: true } },
      },
    });

    if (!payment) {
      throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment was not found');
    }

    if (payment.status === PaymentStatus.CAPTURED) {
      return this.mapPayment(payment);
    }

    let externalReference = payment.externalReference;

    if (!externalReference) {
      const session = await mockPaymentProvider.createSession({
        paymentId: payment.id,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
      });
      externalReference = session.externalReference;
      await prisma.payment.update({
        where: { id: payment.id },
        data: { externalReference },
      });
    }

    const captureResult = paymentConfig.mockProviderEnabled
      ? await mockPaymentProvider.capture(externalReference)
      : 'failed';

    if (captureResult === 'failed') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
        },
      });

      await notificationsService.enqueuePaymentFailed(payment.bookingId, payment.userId);
      throw new AppError(402, 'PAYMENT_FAILED', 'Payment could not be completed');
    }

    const confirmed = await prisma.$transaction(async (tx) => {
      const capturedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CAPTURED,
          capturedAt: new Date(),
        },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
          reservationExpiresAt: null,
        },
      });

      if (payment.booking.timeSlotId) {
        await tx.timeSlot.update({
          where: { id: payment.booking.timeSlotId },
          data: {
            status: TimeSlotStatus.BOOKED,
            reservedUntil: null,
          },
        });
      }

      return capturedPayment;
    });

    await notificationsService.enqueuePaymentConfirmed(payment.bookingId, payment.userId);
    await notificationsService.enqueueBookingConfirmed(payment.bookingId, payment.userId);

    return this.mapPayment(confirmed);
  }

  public async failPayment(paymentId: string, telegramId: string): Promise<PaymentSummaryResponse> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, user: { telegramId } },
    });

    if (!payment) {
      throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment was not found');
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
      },
    });

    await notificationsService.enqueuePaymentFailed(payment.bookingId, payment.userId);
    return this.mapPayment(updated);
  }

  public async getBookingPayment(
    bookingId: string,
    telegramId: string,
  ): Promise<PaymentSummaryResponse | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        bookingId,
        user: { telegramId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return null;
    }

    const checkoutUrl =
      typeof payment.metadata === 'object' &&
      payment.metadata !== null &&
      'checkoutUrl' in payment.metadata &&
      typeof payment.metadata.checkoutUrl === 'string'
        ? payment.metadata.checkoutUrl
        : null;

    return this.mapPayment(payment, checkoutUrl);
  }

  public async listAdminPayments(query: {
    page: number;
    limit: number;
    status?: PaymentStatus;
  }): Promise<{ items: PaymentSummaryResponse[]; total: number }> {
    const where = query.status ? { status: query.status } : {};
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((payment) => this.mapPayment(payment)),
      total,
    };
  }

  public buildReservationExpiry(): Date {
    return DateTime.utc().plus({ minutes: bookingConfig.reservationMinutes }).toJSDate();
  }

  private mapPayment(
    payment: {
      id: string;
      bookingId: string;
      kind: PaymentKind;
      method: PaymentMethod;
      status: PaymentStatus;
      amount: Prisma.Decimal;
      currency: CurrencyCode;
      externalReference: string | null;
      expiresAt: Date | null;
      createdAt: Date;
    },
    checkoutUrl: string | null = null,
  ): PaymentSummaryResponse {
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      kind: payment.kind,
      method: payment.method,
      status: payment.status,
      amount: payment.amount.toFixed(2),
      currency: payment.currency,
      externalReference: payment.externalReference,
      checkoutUrl,
      expiresAt: payment.expiresAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}

export const paymentsService = new PaymentsService();
