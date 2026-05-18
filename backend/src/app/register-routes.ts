import { type Express } from 'express';

import { healthRouter } from './health.router';
import { appConfig } from '../config';
import { createModulesRouter } from '../modules';

export const registerRoutes = (app: Express): void => {
  app.use(appConfig.apiPrefix, healthRouter);
  app.use(appConfig.apiPrefix, createModulesRouter());
};
