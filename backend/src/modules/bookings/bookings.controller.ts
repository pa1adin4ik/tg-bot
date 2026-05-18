import { type RequestHandler } from 'express';

import { asyncHandler } from '../../common/utils/async-handler';
import type {
  CancelBookingBodyDto,
  CreateBookingBodyDto,
  ListBookingDatesQueryDto,
  ListBookingSlotsQueryDto,
  ListUserBookingsQueryDto,
  RescheduleBookingBodyDto,
  RescheduleSlotsQueryDto,
} from './dto';
import { bookingsService } from './bookings.service';

class BookingsController {
  public listDates: RequestHandler = asyncHandler(async (request, response) => {
    const data = await bookingsService.listAvailableDates(
      request.query as unknown as ListBookingDatesQueryDto,
    );

    response.status(200).json({
      success: true,
      data,
    });
  });

  public listSlots: RequestHandler = asyncHandler(async (request, response) => {
    const data = await bookingsService.listAvailableSlots(
      request.query as unknown as ListBookingSlotsQueryDto,
    );

    response.status(200).json({
      success: true,
      data,
    });
  });

  public create: RequestHandler = asyncHandler(async (request, response) => {
    const data = await bookingsService.createBooking(request.body as CreateBookingBodyDto);

    response.status(201).json({
      success: true,
      data,
    });
  });

  public listUserBookings: RequestHandler = asyncHandler(async (request, response) => {
    const data = await bookingsService.listUserBookings(
      request.params as unknown as { telegramId: string },
      request.query as unknown as ListUserBookingsQueryDto,
    );

    response.status(200).json({
      success: true,
      data,
    });
  });

  public cancel: RequestHandler = asyncHandler(async (request, response) => {
    const data = await bookingsService.cancelBooking(
      (request.params as { bookingId: string }).bookingId,
      request.body as CancelBookingBodyDto,
    );

    response.status(200).json({
      success: true,
      data,
    });
  });

  public listRescheduleSlots: RequestHandler = asyncHandler(async (request, response) => {
    const data = await bookingsService.listRescheduleSlots(
      (request.params as { bookingId: string }).bookingId,
      (request.query as unknown as RescheduleSlotsQueryDto).telegramId,
      request.query as unknown as RescheduleSlotsQueryDto,
    );

    response.status(200).json({
      success: true,
      data,
    });
  });

  public reschedule: RequestHandler = asyncHandler(async (request, response) => {
    const data = await bookingsService.rescheduleBooking(
      (request.params as { bookingId: string }).bookingId,
      request.body as RescheduleBookingBodyDto,
    );

    response.status(200).json({
      success: true,
      data,
    });
  });

  public getById: RequestHandler = asyncHandler(async (request, response) => {
    const { bookingId } = request.params as { bookingId: string };
    const { telegramId } = request.query as { telegramId: string };
    const data = await bookingsService.getBookingById(bookingId, telegramId);
    response.status(200).json({ success: true, data });
  });

  public listAdmin: RequestHandler = asyncHandler(async (request, response) => {
    const query = request.query as {
      page?: string;
      limit?: string;
      status?: string;
      q?: string;
      masterId?: string;
      serviceId?: string;
      from?: string;
      to?: string;
    };

    const data = await bookingsService.listAdminBookings({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
      status: query.status as never,
      q: query.q,
      masterId: query.masterId,
      serviceId: query.serviceId,
      from: query.from,
      to: query.to,
    });

    response.status(200).json({ success: true, data });
  });

  public updateAdminStatus: RequestHandler = asyncHandler(async (request, response) => {
    const { bookingId } = request.params as { bookingId: string };
    const { status } = request.body as { status: string };
    const data = await bookingsService.updateAdminBookingStatus(bookingId, status as never);
    response.status(200).json({ success: true, data });
  });

  public adminCancel: RequestHandler = asyncHandler(async (request, response) => {
    const { bookingId } = request.params as { bookingId: string };
    const { reason } = (request.body ?? {}) as { reason?: string };
    const data = await bookingsService.adminCancelBooking(bookingId, reason);
    response.status(200).json({ success: true, data });
  });
}

export const bookingsController = new BookingsController();
