import { type RequestHandler } from 'express';

import { logger } from '../../config';

export const requestLoggerMiddleware: RequestHandler = (request, response, next) => {
  const startedAt = process.hrtime.bigint();
  const requestLogger = logger.child({
    requestId: request.requestId,
    method: request.method,
    path: request.originalUrl,
  });

  request.log = requestLogger;

  requestLogger.info('Incoming request');

  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    requestLogger.info(
      {
        statusCode: response.statusCode,
        durationMs,
      },
      'Request completed',
    );
  });

  next();
};
