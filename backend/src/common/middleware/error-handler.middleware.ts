import { Prisma } from '@prisma/client';
import { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../../config';
import { AppError } from '../errors/app-error';

const mapPrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return new AppError(409, 'CONFLICT', 'A unique constraint was violated', {
        target: error.meta?.target,
      });
    case 'P2025':
      return new AppError(404, 'NOT_FOUND', 'The requested record was not found');
    default:
      return new AppError(400, 'DATABASE_ERROR', 'Database request failed');
  }
};

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error,
  request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.flatten(),
      },
      requestId: request.requestId,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = mapPrismaError(error);

    response.status(prismaError.statusCode).json({
      success: false,
      error: {
        code: prismaError.code,
        message: prismaError.message,
        details: prismaError.details,
      },
      requestId: request.requestId,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      requestId: request.requestId,
    });
    return;
  }

  logger.error(
    {
      error,
      requestId: request.requestId,
      path: request.originalUrl,
      method: request.method,
    },
    'Unhandled application error',
  );

  response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
    requestId: request.requestId,
  });
};
