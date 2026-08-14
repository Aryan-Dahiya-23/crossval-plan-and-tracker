import type { NextFunction, Request, Response } from 'express';

import { validateSession } from '../../modules/auth/session.service.js';
import { getSessionCookieName } from '../cookie.js';
import { AuthenticationRequiredError } from '../errors.js';

/**
 * Middleware that extracts and validates the session token from cookies or Authorization header.
 * If valid, attaches the authenticated principal to req.user.
 * Non-blocking: unauthenticated requests pass through with req.user undefined.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cookieName = getSessionCookieName();
    let token: string | undefined = req.cookies?.[cookieName];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (token) {
      const principal = await validateSession(token);
      if (principal) {
        req.user = principal;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Route guard middleware that ensures the request is authenticated.
 * Throws AuthenticationRequiredError (401) if req.user is not set.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AuthenticationRequiredError();
  }
  next();
}
