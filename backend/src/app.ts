import express, { type Express } from 'express';

import { registerGlobalMiddleware } from './app/register-global-middleware';
import { registerRoutes } from './app/register-routes';
import { errorHandlerMiddleware } from './common/middleware/error-handler.middleware';
import { notFoundMiddleware } from './common/middleware/not-found.middleware';
import { appConfig } from './config';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', appConfig.trustProxy);

  registerGlobalMiddleware(app);
  registerRoutes(app);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
};
