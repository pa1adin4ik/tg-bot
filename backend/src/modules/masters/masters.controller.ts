import { type RequestHandler } from 'express';

import { asyncHandler } from '../../common/utils/async-handler';
import type {
  CreateMasterBodyDto,
  ListAdminMastersQueryDto,
  ListPublicMastersQueryDto,
  MasterParamDto,
  UpdateMasterBodyDto,
} from './dto';
import { mastersService } from './masters.service';

class MastersController {
  public listPublic: RequestHandler = asyncHandler(async (request, response) => {
    const masters = await mastersService.listPublicMasters(
      request.query as unknown as ListPublicMastersQueryDto,
    );

    response.status(200).json({
      success: true,
      data: masters,
    });
  });

  public getPublicById: RequestHandler = asyncHandler(async (request, response) => {
    const { masterId } = request.params as unknown as MasterParamDto;
    const master = await mastersService.getPublicMaster(masterId);

    response.status(200).json({
      success: true,
      data: master,
    });
  });

  public listAdmin: RequestHandler = asyncHandler(async (request, response) => {
    const masters = await mastersService.listAdminMasters(
      request.query as unknown as ListAdminMastersQueryDto,
    );

    response.status(200).json({
      success: true,
      data: masters,
    });
  });

  public getAdminById: RequestHandler = asyncHandler(async (request, response) => {
    const { masterId } = request.params as unknown as MasterParamDto;
    const master = await mastersService.getAdminMaster(masterId);

    response.status(200).json({
      success: true,
      data: master,
    });
  });

  public create: RequestHandler = asyncHandler(async (request, response) => {
    const master = await mastersService.createMaster(request.body as CreateMasterBodyDto);

    response.status(201).json({
      success: true,
      data: master,
    });
  });

  public update: RequestHandler = asyncHandler(async (request, response) => {
    const { masterId } = request.params as unknown as MasterParamDto;
    const master = await mastersService.updateMaster(masterId, request.body as UpdateMasterBodyDto);

    response.status(200).json({
      success: true,
      data: master,
    });
  });

  public delete: RequestHandler = asyncHandler(async (request, response) => {
    const { masterId } = request.params as unknown as MasterParamDto;
    await mastersService.deleteMaster(masterId);

    response.status(200).json({
      success: true,
      data: {
        message: 'Master deleted successfully',
      },
    });
  });
}

export const mastersController = new MastersController();
