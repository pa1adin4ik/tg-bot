import { BookingStatus, PaymentStatus, TimeSlotStatus } from '@prisma/client';

import { prisma } from '../../database';

export class ReservationsService {
  public async expireStale(): Promise<void> {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const expiredBookings = await tx.booking.findMany({
        where: {
          status: BookingStatus.AWAITING_PREPAYMENT,
          reservationExpiresAt: { lt: now },
        },
        select: { id: true, timeSlotId: true },
      });

      if (expiredBookings.length === 0) {
        return;
      }

      const bookingIds = expiredBookings.map((booking) => booking.id);
      const timeSlotIds = expiredBookings
        .map((booking) => booking.timeSlotId)
        .filter((id): id is string => id !== null);

      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: BookingStatus.EXPIRED },
      });

      await tx.payment.updateMany({
        where: {
          bookingId: { in: bookingIds },
          status: { in: [PaymentStatus.PENDING, PaymentStatus.RESERVED] },
        },
        data: { status: PaymentStatus.EXPIRED },
      });

      if (timeSlotIds.length > 0) {
        await tx.timeSlot.updateMany({
          where: { id: { in: timeSlotIds } },
          data: {
            status: TimeSlotStatus.AVAILABLE,
            reservedUntil: null,
          },
        });
      }

      await tx.timeSlot.updateMany({
        where: {
          status: { in: [TimeSlotStatus.RESERVED, TimeSlotStatus.EXPIRED] },
          reservedUntil: { lt: now },
        },
        data: {
          status: TimeSlotStatus.AVAILABLE,
          reservedUntil: null,
        },
      });
    });
  }

  public async acquireMasterLock(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    masterId: string,
  ): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${masterId}))`;
  }
}

export const reservationsService = new ReservationsService();
