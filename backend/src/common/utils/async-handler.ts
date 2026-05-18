import { type NextFunction, type Request, type RequestHandler, type Response } from 'express';

type AsyncRouteHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler = (handler: AsyncRouteHandler): RequestHandler => {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
};
