import { type RequestHandler } from 'express';

import { asyncHandler } from '../../common/utils/async-handler';
import type {
  ListServiceCategoriesQueryDto,
  ListServicesQueryDto,
} from './dto';
import { servicesService } from './services.service';

class ServicesController {
  public listServices: RequestHandler = asyncHandler(async (request, response) => {
    const services = await servicesService.listServices(
      request.query as unknown as ListServicesQueryDto,
      request.auth,
    );

    response.status(200).json({
      success: true,
      data: services,
    });
  });

  public listCategories: RequestHandler = asyncHandler(async (request, response) => {
    const categories = await servicesService.listCategories(
      request.query as unknown as ListServiceCategoriesQueryDto,
      request.auth,
    );

    response.status(200).json({
      success: true,
      data: categories,
    });
  });
}

export const servicesController = new ServicesController();
