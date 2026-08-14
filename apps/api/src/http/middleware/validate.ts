import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export interface ValidationSchemas {
  params?: ZodTypeAny | undefined;
  query?: ZodTypeAny | undefined;
  body?: ZodTypeAny | undefined;
}

/**
 * Higher-order middleware factory that validates request params, query, and body against Zod schemas.
 *
 * If validation succeeds, req.params, req.query, and req.body are populated with the parsed/coerced data.
 * If validation fails, the resulting ZodError is passed to next(error) for standard serialization.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        Object.defineProperty(req, 'params', {
          value: parsedParams,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      if (schemas.body) {
        const parsedBody = schemas.body.parse(req.body);
        req.body = parsedBody;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
