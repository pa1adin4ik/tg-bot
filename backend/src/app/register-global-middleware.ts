import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import {
  requestContextMiddleware,
  requestLoggerMiddleware,
} from '../common/middleware';
import { appConfig } from '../config';

export const registerGlobalMiddleware = (app: Express): void => {
  app.use(requestContextMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: appConfig.bodySizeLimit }));
  app.use(express.urlencoded({ extended: true, limit: appConfig.bodySizeLimit }));
};
