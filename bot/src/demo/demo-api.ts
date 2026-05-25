import { DateTime } from 'luxon';

import type {
  BookingListScope,
  BotBookingDateOption,
  BotBookingSlotOption,
  BotBookingSummary,
} from '../integrations/api/bookings.api';
import type { BotMasterDetail, BotMasterListItem } from '../integrations/api/masters.api';
import type { BotPaymentSummary } from '../integrations/api/payments.api';
import type { BotService } from '../integrations/api/services.api';

const demoServices: BotService[] = [
  {
    id: 'svc-classic-haircut',
    name: 'Classic Haircut',
    slug: 'classic-haircut',
    description: 'A clean salon haircut with wash and styling.',
    durationMinutes: 60,
    price: '25',
    currency: 'USD',
    prepaymentRequired: false,
    prepaymentAmount: null,
    isActive: true,
    category: {
      id: 'cat-hair',
      name: 'Hair Services',
      slug: 'hair-services',
    },
  },
  {
    id: 'svc-beard-styling',
    name: 'Beard Styling',
    slug: 'beard-styling',
    description: 'Shape, trim, and finishing care for beard styling.',
    durationMinutes: 30,
    price: '15',
    currency: 'USD',
    prepaymentRequired: false,
    prepaymentAmount: null,
    isActive: true,
    category: {
      id: 'cat-men',
      name: 'Men Grooming',
      slug: 'men-grooming',
    },
  },
  {
    id: 'svc-color-refresh',
    name: 'Color Refresh',
    slug: 'color-refresh',
    description: 'Tone refresh and glossy finish for returning clients.',
    durationMinutes: 120,
    price: '80',
    currency: 'USD',
    prepaymentRequired: true,
    prepaymentAmount: '20',
    isActive: true,
    category: {
      id: 'cat-color',
      name: 'Coloring',
      slug: 'coloring',
    },
  },
];

const demoMasters: BotMasterDetail[] = [
  {
    id: 'master-anna-kim',
    fullName: 'Anna Kim',
    avatarUrl: null,
    bio: 'Anna focuses on polished cuts and natural-looking color work for everyday wear.',
    experienceYears: 6,
    ratingAvg: '4.9',
    reviewCount: 28,
    isVisible: true,
    specializations: ['Classic Haircut', 'Color Refresh'],
    user: {
      firstName: 'Anna',
      lastName: 'Kim',
      email: null,
      phone: null,
    },
    services: [
      { id: 'svc-classic-haircut', name: 'Classic Haircut', slug: 'classic-haircut' },
      { id: 'svc-color-refresh', name: 'Color Refresh', slug: 'color-refresh' },
    ],
    schedules: [
      {
        id: 'schedule-anna-1',
        type: 'WORKING_HOURS',
        dayOfWeek: 'MONDAY',
        specificDate: null,
        startMinute: 600,
        endMinute: 1140,
        timezone: 'UTC',
        isRecurring: true,
        isActive: true,
        validFrom: null,
        validTo: null,
      },
      {
        id: 'schedule-anna-2',
        type: 'WORKING_HOURS',
        dayOfWeek: 'WEDNESDAY',
        specificDate: null,
        startMinute: 600,
        endMinute: 1140,
        timezone: 'UTC',
        isRecurring: true,
        isActive: true,
        validFrom: null,
        validTo: null,
      },
      {
        id: 'schedule-anna-3',
        type: 'WORKING_HOURS',
        dayOfWeek: 'FRIDAY',
        specificDate: null,
        startMinute: 600,
        endMinute: 1140,
        timezone: 'UTC',
        isRecurring: true,
        isActive: true,
        validFrom: null,
        validTo: null,
      },
    ],
    portfolio: [
      {
        id: 'portfolio-anna-1',
        title: 'Layered Cut',
        description: 'Soft movement and volume for medium-length hair.',
        mediaUrl: 'https://example.com/portfolio/anna-1.jpg',
        mediaType: 'IMAGE',
        sortOrder: 1,
        isPublished: true,
      },
      {
        id: 'portfolio-anna-2',
        title: 'Glossy Color Refresh',
        description: 'Rich tone refresh with subtle shine finish.',
        mediaUrl: 'https://example.com/portfolio/anna-2.jpg',
        mediaType: 'IMAGE',
        sortOrder: 2,
        isPublished: true,
      },
    ],
  },
  {
    id: 'master-david-noor',
    fullName: 'David Noor',
    avatarUrl: null,
    bio: 'David specializes in men grooming, beard shaping, and fast, sharp cleanup appointments.',
    experienceYears: 4,
    ratingAvg: '4.8',
    reviewCount: 19,
    isVisible: true,
    specializations: ['Classic Haircut', 'Beard Styling'],
    user: {
      firstName: 'David',
      lastName: 'Noor',
      email: null,
      phone: null,
    },
    services: [
      { id: 'svc-classic-haircut', name: 'Classic Haircut', slug: 'classic-haircut' },
      { id: 'svc-beard-styling', name: 'Beard Styling', slug: 'beard-styling' },
    ],
    schedules: [
      {
        id: 'schedule-david-1',
        type: 'WORKING_HOURS',
        dayOfWeek: 'TUESDAY',
        specificDate: null,
        startMinute: 660,
        endMinute: 1200,
        timezone: 'UTC',
        isRecurring: true,
        isActive: true,
        validFrom: null,
        validTo: null,
      },
      {
        id: 'schedule-david-2',
        type: 'WORKING_HOURS',
        dayOfWeek: 'THURSDAY',
        specificDate: null,
        startMinute: 660,
        endMinute: 1200,
        timezone: 'UTC',
        isRecurring: true,
        isActive: true,
        validFrom: null,
        validTo: null,
      },
      {
        id: 'schedule-david-3',
        type: 'WORKING_HOURS',
        dayOfWeek: 'SATURDAY',
        specificDate: null,
        startMinute: 660,
        endMinute: 1200,
        timezone: 'UTC',
        isRecurring: true,
        isActive: true,
        validFrom: null,
        validTo: null,
      },
    ],
    portfolio: [
      {
        id: 'portfolio-david-1',
        title: 'Fade + Beard Combo',
        description: 'Sharp fade paired with a tight beard contour.',
        mediaUrl: 'https://example.com/portfolio/david-1.jpg',
        mediaType: 'IMAGE',
        sortOrder: 1,
        isPublished: true,
      },
    ],
  },
];

interface DemoBookingRecord extends BotBookingSummary {
  telegramId: string;
  paymentId: string | null;
}

const demoBookings = new Map<string, DemoBookingRecord>();
const demoReviews = new Set<string>();

const getService = (serviceId: string): BotService => {
  const service = demoServices.find((item) => item.id === serviceId);

  if (!service) {
    throw new Error(`Unknown demo service: ${serviceId}`);
  }

  return service;
};

const getMasterRecord = (masterId: string): BotMasterDetail => {
  const master = demoMasters.find((item) => item.id === masterId);

  if (!master) {
    throw new Error(`Unknown demo master: ${masterId}`);
  }

  return master;
};

const getMasterSlots = (masterId: string): Array<{ hour: number; minute: number }> => {
  if (masterId === 'master-david-noor') {
    return [
      { hour: 11, minute: 0 },
      { hour: 13, minute: 0 },
      { hour: 15, minute: 0 },
      { hour: 17, minute: 0 },
    ];
  }

  return [
    { hour: 10, minute: 0 },
    { hour: 12, minute: 0 },
    { hour: 14, minute: 0 },
    { hour: 16, minute: 0 },
  ];
};

const createSlot = (
  service: BotService,
  masterId: string,
  date: string,
  hour: number,
  minute: number,
): BotBookingSlotOption => {
  const start = DateTime.fromISO(date, { zone: 'UTC' }).set({ hour, minute, second: 0, millisecond: 0 });
  const end = start.plus({ minutes: service.durationMinutes });

  return {
    startAt: start.toISO()!,
    endAt: end.toISO()!,
    label: `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`,
  };
};

const listOpenSlots = (serviceId: string, masterId: string, date: string): BotBookingSlotOption[] => {
  const service = getService(serviceId);
  const reservedStarts = new Set(
    Array.from(demoBookings.values())
      .filter((booking) => booking.master.id === masterId)
      .filter((booking) => ['AWAITING_PREPAYMENT', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status))
      .map((booking) => DateTime.fromISO(booking.startAt).toUTC().toISO()),
  );

  return getMasterSlots(masterId)
    .map((slot) => createSlot(service, masterId, date, slot.hour, slot.minute))
    .filter((slot) => !reservedStarts.has(DateTime.fromISO(slot.startAt).toUTC().toISO()));
};

const createDemoBookingId = (): string => `demo-booking-${Math.random().toString(36).slice(2, 10)}`;
const createDemoPaymentId = (): string => `demo-payment-${Math.random().toString(36).slice(2, 10)}`;

const cloneBooking = (booking: DemoBookingRecord): BotBookingSummary => ({
  id: booking.id,
  status: booking.status,
  service: { ...booking.service },
  master: { ...booking.master },
  startAt: booking.startAt,
  endAt: booking.endAt,
  totalPrice: booking.totalPrice,
  currency: booking.currency,
  prepaymentAmount: booking.prepaymentAmount,
  paymentStatus: booking.paymentStatus,
  paymentExpiresAt: booking.paymentExpiresAt,
  reservationExpiresAt: booking.reservationExpiresAt,
  notes: booking.notes,
});

const ensureSeedBookings = (telegramId: string): void => {
  const hasAny = Array.from(demoBookings.values()).some((booking) => booking.telegramId === telegramId);

  if (hasAny) {
    return;
  }

  const completedStart = DateTime.utc().minus({ days: 3 }).set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
  const completedEnd = completedStart.plus({ minutes: 60 });
  const upcomingStart = DateTime.utc().plus({ days: 2 }).set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  const upcomingEnd = upcomingStart.plus({ minutes: 60 });

  demoBookings.set('demo-seed-completed-' + telegramId, {
    id: 'demo-seed-completed-' + telegramId,
    telegramId,
    status: 'COMPLETED',
    service: { id: 'svc-classic-haircut', name: 'Classic Haircut' },
    master: { id: 'master-anna-kim', fullName: 'Anna Kim' },
    startAt: completedStart.toISO()!,
    endAt: completedEnd.toISO()!,
    totalPrice: '25',
    currency: 'USD',
    prepaymentAmount: null,
    paymentStatus: 'CAPTURED',
    paymentExpiresAt: null,
    reservationExpiresAt: null,
    notes: 'Sample completed booking for demo mode.',
    paymentId: null,
  });

  demoBookings.set('demo-seed-upcoming-' + telegramId, {
    id: 'demo-seed-upcoming-' + telegramId,
    telegramId,
    status: 'CONFIRMED',
    service: { id: 'svc-classic-haircut', name: 'Classic Haircut' },
    master: { id: 'master-david-noor', fullName: 'David Noor' },
    startAt: upcomingStart.toISO()!,
    endAt: upcomingEnd.toISO()!,
    totalPrice: '25',
    currency: 'USD',
    prepaymentAmount: null,
    paymentStatus: null,
    paymentExpiresAt: null,
    reservationExpiresAt: null,
    notes: 'Sample upcoming booking for demo mode.',
    paymentId: null,
  });
};

const getOwnedBookingRecord = (bookingId: string, telegramId: string): DemoBookingRecord => {
  ensureSeedBookings(telegramId);

  const booking = demoBookings.get(bookingId);

  if (!booking || booking.telegramId !== telegramId) {
    throw new Error('Demo booking not found');
  }

  return booking;
};

export const demoApi = {
  listServices(): BotService[] {
    return demoServices.map((service) => ({ ...service, category: { ...service.category } }));
  },

  listMasters(serviceSlug?: string): BotMasterListItem[] {
    const masters = serviceSlug
      ? demoMasters.filter((master) => master.services.some((service) => service.slug === serviceSlug))
      : demoMasters;

    return masters.map((master) => ({
      id: master.id,
      fullName: master.fullName,
      avatarUrl: master.avatarUrl,
      bio: master.bio,
      experienceYears: master.experienceYears,
      ratingAvg: master.ratingAvg,
      reviewCount: master.reviewCount,
      isVisible: master.isVisible,
      specializations: [...master.specializations],
    }));
  },

  getMaster(masterId: string): BotMasterDetail {
    const master = getMasterRecord(masterId);
    return {
      ...master,
      user: { ...master.user },
      services: master.services.map((service) => ({ ...service })),
      schedules: master.schedules.map((schedule) => ({ ...schedule })),
      portfolio: master.portfolio.map((item) => ({ ...item })),
      specializations: [...master.specializations],
    };
  },

  listBookingDates(serviceId: string, masterId: string): BotBookingDateOption[] {
    return Array.from({ length: 5 }, (_, index) => {
      const date = DateTime.utc().plus({ days: index + 1 }).startOf('day');
      const slots = listOpenSlots(serviceId, masterId, date.toISODate()!);

      return {
        date: date.toISODate()!,
        label: date.toFormat('dd LLL'),
        availableSlotsCount: slots.length,
      };
    }).filter((item) => item.availableSlotsCount > 0);
  },

  listBookingSlots(serviceId: string, masterId: string, date: string): BotBookingSlotOption[] {
    return listOpenSlots(serviceId, masterId, date);
  },

  createBooking(payload: {
    telegramUser: { telegramId: string };
    serviceId: string;
    masterId: string;
    slotStartAt: string;
    paymentOption: 'AT_VENUE' | 'PREPAY_NOW';
    notes?: string;
  }): BotBookingSummary {
    ensureSeedBookings(payload.telegramUser.telegramId);

    const service = getService(payload.serviceId);
    const master = getMasterRecord(payload.masterId);
    const start = DateTime.fromISO(payload.slotStartAt).toUTC();
    const end = start.plus({ minutes: service.durationMinutes });
    const requiresPrepayment = service.prepaymentRequired || payload.paymentOption === 'PREPAY_NOW';
    const paymentId = requiresPrepayment ? createDemoPaymentId() : null;

    const booking: DemoBookingRecord = {
      id: createDemoBookingId(),
      telegramId: payload.telegramUser.telegramId,
      status: requiresPrepayment ? 'AWAITING_PREPAYMENT' : 'CONFIRMED',
      service: {
        id: service.id,
        name: service.name,
      },
      master: {
        id: master.id,
        fullName: master.fullName,
      },
      startAt: start.toISO()!,
      endAt: end.toISO()!,
      totalPrice: service.price,
      currency: service.currency,
      prepaymentAmount: service.prepaymentAmount,
      paymentStatus: requiresPrepayment ? 'RESERVED' : null,
      paymentExpiresAt: requiresPrepayment ? DateTime.utc().plus({ minutes: 30 }).toISO()! : null,
      reservationExpiresAt: requiresPrepayment ? DateTime.utc().plus({ minutes: 30 }).toISO()! : null,
      notes: payload.notes ?? 'Created in demo mode.',
      paymentId,
    };

    demoBookings.set(booking.id, booking);
    return cloneBooking(booking);
  },

  listUserBookings(telegramId: string, scope: BookingListScope = 'upcoming'): BotBookingSummary[] {
    ensureSeedBookings(telegramId);

    const bookings = Array.from(demoBookings.values())
      .filter((booking) => booking.telegramId === telegramId)
      .filter((booking) => {
        if (scope === 'all' || scope === 'history') {
          return true;
        }

        if (scope === 'completed') {
          return booking.status === 'COMPLETED';
        }

        if (scope === 'cancelled') {
          return ['CANCELED', 'EXPIRED', 'NO_SHOW'].includes(booking.status);
        }

        return ['PENDING', 'AWAITING_PREPAYMENT', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status);
      })
      .sort((left, right) => right.startAt.localeCompare(left.startAt));

    return bookings.map(cloneBooking);
  },

  getBooking(bookingId: string, telegramId: string): BotBookingSummary {
    return cloneBooking(getOwnedBookingRecord(bookingId, telegramId));
  },

  cancelBooking(bookingId: string, telegramId: string, _reason?: string): BotBookingSummary {
    const booking = getOwnedBookingRecord(bookingId, telegramId);

    booking.status = 'CANCELED';
    booking.paymentStatus = booking.paymentStatus ? 'CANCELED' : booking.paymentStatus;
    booking.paymentExpiresAt = null;
    booking.reservationExpiresAt = null;

    return cloneBooking(booking);
  },

  listRescheduleSlots(bookingId: string, telegramId: string, date: string): BotBookingSlotOption[] {
    const booking = getOwnedBookingRecord(bookingId, telegramId);
    return listOpenSlots(booking.service.id, booking.master.id, date);
  },

  rescheduleBooking(bookingId: string, telegramId: string, slotStartAt: string): BotBookingSummary {
    const booking = getOwnedBookingRecord(bookingId, telegramId);
    const service = getService(booking.service.id);
    const start = DateTime.fromISO(slotStartAt).toUTC();

    booking.startAt = start.toISO()!;
    booking.endAt = start.plus({ minutes: service.durationMinutes }).toISO()!;
    booking.status = booking.paymentStatus === 'CAPTURED' ? 'CONFIRMED' : booking.status;

    return cloneBooking(booking);
  },

  getBookingPayment(bookingId: string, telegramId: string): BotPaymentSummary | null {
    const booking = getOwnedBookingRecord(bookingId, telegramId);

    if (!booking.paymentId || !booking.prepaymentAmount) {
      return null;
    }

    return {
      id: booking.paymentId,
      bookingId: booking.id,
      status: booking.paymentStatus ?? 'PENDING',
      amount: booking.prepaymentAmount,
      currency: booking.currency,
      checkoutUrl: 'https://example.com/demo-checkout',
      expiresAt: booking.paymentExpiresAt,
    };
  },

  initiatePayment(paymentId: string, telegramId: string): BotPaymentSummary {
    const booking = Array.from(demoBookings.values()).find(
      (item) => item.paymentId === paymentId && item.telegramId === telegramId,
    );

    if (!booking || !booking.prepaymentAmount) {
      throw new Error('Demo payment not found');
    }

    booking.paymentStatus = 'AUTHORIZED';

    return {
      id: paymentId,
      bookingId: booking.id,
      status: booking.paymentStatus,
      amount: booking.prepaymentAmount,
      currency: booking.currency,
      checkoutUrl: 'https://example.com/demo-checkout',
      expiresAt: booking.paymentExpiresAt,
    };
  },

  confirmPayment(paymentId: string, telegramId: string): BotPaymentSummary {
    const booking = Array.from(demoBookings.values()).find(
      (item) => item.paymentId === paymentId && item.telegramId === telegramId,
    );

    if (!booking || !booking.prepaymentAmount) {
      throw new Error('Demo payment not found');
    }

    booking.paymentStatus = 'CAPTURED';
    booking.status = 'CONFIRMED';
    booking.paymentExpiresAt = null;
    booking.reservationExpiresAt = null;

    return {
      id: paymentId,
      bookingId: booking.id,
      status: booking.paymentStatus,
      amount: booking.prepaymentAmount,
      currency: booking.currency,
      checkoutUrl: null,
      expiresAt: null,
    };
  },

  async createReview(payload: { bookingId: string; telegramId: string; rating: number }): Promise<void> {
    const booking = getOwnedBookingRecord(payload.bookingId, payload.telegramId);
    demoReviews.add(`${booking.id}:${payload.rating}`);
  },
};
