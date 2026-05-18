import { type RequestHandler } from 'express';

import { AppError } from '../errors/app-error';
import { securityConfig } from '../../config';

export const requireBotApiSecret: RequestHandler = (request, _response, next) => {
  const providedSecret = request.header('x-bot-secret');

  if (!providedSecret || providedSecret !== securityConfig.botApiSecret) {
    next(new AppError(401, 'UNAUTHORIZED_BOT', 'Invalid bot API credentials'));
    return;
  }

  next();
};
