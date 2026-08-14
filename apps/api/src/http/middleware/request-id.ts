import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const VALID_REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * Middleware that assigns a unique request ID to each incoming HTTP request.
 *
 * If a valid 'X-Request-Id' header is supplied by an upstream client/proxy,
 * it is sanitized and reused. Otherwise, a secure random ID prefixed with 'req_' is generated.
 *
 * The ID is attached to res.locals.requestId and sent back in the 'X-Request-Id' response header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingHeader = req.headers['x-request-id'];
  let requestId: string;

  if (typeof incomingHeader === 'string' && VALID_REQUEST_ID_REGEX.test(incomingHeader.trim())) {
    requestId = incomingHeader.trim();
  } else {
    requestId = `req_${crypto.randomUUID().replace(/-/g, '')}`;
  }

  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}

/**
 * Helper to retrieve the current request ID from Express response locals.
 */
export function getRequestId(res: Response): string {
  return res.locals.requestId ?? 'req_unknown';
}
