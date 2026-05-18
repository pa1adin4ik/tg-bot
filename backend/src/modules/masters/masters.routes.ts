import { Router } from 'express';

import { validate } from '../../common/middleware';
import { authorize } from '../auth';
import {
  createMasterBodySchema,
  listAdminMastersQuerySchema,
  listPublicMastersQuerySchema,
  masterParamSchema,
  updateMasterBodySchema,
} from './dto';
import { mastersController } from './masters.controller';

export const mastersRouter = Router();

mastersRouter.get(
  '/masters',
  validate({ query: listPublicMastersQuerySchema }),
  mastersController.listPublic,
);
mastersRouter.get(
  '/masters/:masterId',
  validate({ params: masterParamSchema }),
  mastersController.getPublicById,
);

mastersRouter.get(
  '/admin/masters',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ query: listAdminMastersQuerySchema }),
  mastersController.listAdmin,
);
mastersRouter.get(
  '/admin/masters/:masterId',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ params: masterParamSchema }),
  mastersController.getAdminById,
);
mastersRouter.post(
  '/admin/masters',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ body: createMasterBodySchema }),
  mastersController.create,
);
mastersRouter.patch(
  '/admin/masters/:masterId',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ params: masterParamSchema, body: updateMasterBodySchema }),
  mastersController.update,
);
mastersRouter.delete(
  '/admin/masters/:masterId',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  validate({ params: masterParamSchema }),
  mastersController.delete,
);
