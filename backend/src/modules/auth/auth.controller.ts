import { type RequestHandler } from 'express';

import { asyncHandler } from '../../common/utils/async-handler';
import { AppError } from '../../common/errors/app-error';
import { authService } from './auth.service';

class AuthController {
  public login: RequestHandler = asyncHandler(async (request, response) => {
    const result = await authService.login(request.body);

    response.status(200).json({
      success: true,
      data: result,
    });
  });

  public refresh: RequestHandler = asyncHandler(async (request, response) => {
    const result = await authService.refresh(request.body);

    response.status(200).json({
      success: true,
      data: result,
    });
  });

  public me: RequestHandler = asyncHandler(async (request, response) => {
    if (!request.auth?.adminId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required');
    }

    const result = await authService.getCurrentUser(request.auth.adminId);

    response.status(200).json({
      success: true,
      data: result,
    });
  });

  public logout: RequestHandler = asyncHandler(async (request, response) => {
    if (!request.auth?.adminId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required');
    }

    await authService.logout(request.auth.adminId);

    response.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  });
}

export const authController = new AuthController();
