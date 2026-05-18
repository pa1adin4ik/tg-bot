import { Router } from 'express';

import { validate } from '../../common/middleware';
import { optionalAuthenticate } from '../auth';
import {
  listServiceCategoriesQuerySchema,
  listServicesQuerySchema,
} from './dto';
import { servicesController } from './services.controller';

export const servicesRouter = Router();

servicesRouter.get(
  '/services/categories',
  optionalAuthenticate,
  validate({ query: listServiceCategoriesQuerySchema }),
  servicesController.listCategories,
);

servicesRouter.get(
  '/services',
  optionalAuthenticate,
  validate({ query: listServicesQuerySchema }),
  servicesController.listServices,
);
