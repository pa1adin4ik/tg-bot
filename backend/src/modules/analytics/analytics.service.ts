import { BookingStatus, PaymentStatus } from '@prisma/client';

import { prisma } from '../../database';

export class AnalyticsService {
  public async getDashboard(query: { from: Date; to: Date }) {
    const bookingWhere = {
      createdAt: { gte: query.from, lte: query.to },
    };

    const [bookingsCount, revenueBookings, revenuePayments, topServices, topMasters, repeatCustomers] =
      await Promise.all([
        prisma.booking.count({ where: bookingWhere }),
        prisma.booking.aggregate({
          where: {
            ...bookingWhere,
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.IN_PROGRESS] },
          },
          _sum: { totalPrice: true },
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.CAPTURED,
            createdAt: { gte: query.from, lte: query.to },
          },
          _sum: { amount: true },
        }),
        prisma.booking.groupBy({
          by: ['serviceId'],
          where: bookingWhere,
          _count: { _all: true },
          orderBy: { _count: { serviceId: 'desc' } },
          take: 5,
        }),
        prisma.booking.groupBy({
          by: ['masterId'],
          where: bookingWhere,
          _count: { _all: true },
          orderBy: { _count: { masterId: 'desc' } },
          take: 5,
        }),
        prisma.booking.groupBy({
          by: ['userId'],
          where: bookingWhere,
          _count: { _all: true },
        }),
      ]);

    const repeatCustomersCount = repeatCustomers.filter((item) => item._count._all > 1).length;

    const serviceIds = topServices.map((item) => item.serviceId);
    const masterIds = topMasters.map((item) => item.masterId);

    const [services, masters] = await Promise.all([
      prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } }),
      prisma.master.findMany({
        where: { id: { in: masterIds } },
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    return {
      bookingsCount,
      revenueFromBookings: revenueBookings._sum.totalPrice?.toFixed(2) ?? '0.00',
      revenueFromPayments: revenuePayments._sum.amount?.toFixed(2) ?? '0.00',
      topServices: topServices.map((item) => ({
        serviceId: item.serviceId,
        name: services.find((service) => service.id === item.serviceId)?.name ?? 'Unknown',
        count: item._count._all,
      })),
      topMasters: topMasters.map((item) => {
        const master = masters.find((entry) => entry.id === item.masterId);
        return {
          masterId: item.masterId,
          name: master
            ? [master.user.firstName, master.user.lastName].filter(Boolean).join(' ')
            : 'Unknown',
          count: item._count._all,
        };
      }),
      repeatCustomers: repeatCustomersCount,
    };
  }

  public async getBookingsTrend(query: { from: Date; to: Date }) {
    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: query.from, lte: query.to } },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();

    for (const booking of bookings) {
      const key = booking.createdAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, count]) => ({ date, count }));
  }
}

export const analyticsService = new AnalyticsService();
