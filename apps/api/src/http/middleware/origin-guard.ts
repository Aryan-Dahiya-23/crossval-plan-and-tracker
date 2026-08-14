import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { ValidationError } from '../errors.js';

export interface OriginGuardOptions {
  allowedOrigins: string[];
}

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Validates Origin/Referer header on state-changing mutation requests to protect against CSRF.
 */
export function createOriginGuard(options: OriginGuardOptions): RequestHandler {
  const allowedSet = new Set(options.allowedOrigins);

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!MUTATION_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const originHeader = req.headers.origin;

    if (originHeader) {
      if (!allowedSet.has(originHeader)) {
        next(new ValidationError(`Cross-origin mutation rejected from origin: ${originHeader}`));
        return;
      }
    }

    next();
  };
}
