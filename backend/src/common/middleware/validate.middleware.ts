import { type Request, type RequestHandler } from 'express';
import { type ZodTypeAny } from 'zod';

type RequestValidationSchema = Partial<{
  body: ZodTypeAny;
  params: ZodTypeAny;
  query: ZodTypeAny;
}>;

export const validate = (schema: RequestValidationSchema): RequestHandler => {
  return async (request, _response, next) => {
    try {
      const mutableRequest = request as Request & {
        body: unknown;
        params: unknown;
        query: unknown;
      };

      if (schema.body) {
        mutableRequest.body = await schema.body.parseAsync(request.body);
      }

      if (schema.params) {
        mutableRequest.params = await schema.params.parseAsync(request.params);
      }

      if (schema.query) {
        mutableRequest.query = await schema.query.parseAsync(request.query);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
