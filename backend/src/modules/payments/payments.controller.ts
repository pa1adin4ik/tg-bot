import { PaymentStatus } from '@prisma/client';
import { type RequestHandler } from 'express';

import { asyncHandler } from '../../common/utils/async-handler';
import { paymentsService } from './payments.service';

class PaymentsController {
  public initiate: RequestHandler = asyncHandler(async (request, response) => {
    const { paymentId } = request.params as { paymentId: string };
    const { telegramId } = request.body as { telegramId: string };
    const data = await paymentsService.initiatePayment(paymentId, telegramId);
    response.status(200).json({ success: true, data });
  });

  public confirm: RequestHandler = asyncHandler(async (request, response) => {
    const { paymentId } = request.params as { paymentId: string };
    const { telegramId } = request.body as { telegramId: string };
    const data = await paymentsService.confirmPayment(paymentId, telegramId);
    response.status(200).json({ success: true, data });
  });

  public fail: RequestHandler = asyncHandler(async (request, response) => {
    const { paymentId } = request.params as { paymentId: string };
    const { telegramId } = request.body as { telegramId: string };
    const data = await paymentsService.failPayment(paymentId, telegramId);
    response.status(200).json({ success: true, data });
  });

  public getByBooking: RequestHandler = asyncHandler(async (request, response) => {
    const { bookingId } = request.params as { bookingId: string };
    const { telegramId } = request.query as { telegramId: string };
    const data = await paymentsService.getBookingPayment(bookingId, telegramId);
    response.status(200).json({ success: true, data });
  });

  public listAdmin: RequestHandler = asyncHandler(async (request, response) => {
    const query = request.query as { page?: string; limit?: string; status?: PaymentStatus };
    const data = await paymentsService.listAdminPayments({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
      status: query.status,
    });
    response.status(200).json({ success: true, data });
  });
}

export const paymentsController = new PaymentsController();
