import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { RateLimitedError } from '../errors.js';

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string | undefined;
}

interface ClientRecord {
  timestamps: number[];
}

/**
 * In-memory sliding window rate limiter middleware.
 */
export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  const { windowMs, max, message } = options;
  const clientMap = new Map<string, ClientRecord>();

  // Periodic cleanup of stale client records every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clientMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        clientMap.delete(ip);
      }
    }
  }, 300_000);

  cleanupInterval.unref();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown_ip';
    const now = Date.now();

    let record = clientMap.get(ip);
    if (!record) {
      record = { timestamps: [] };
      clientMap.set(ip, record);
    }

    // Retain only timestamps within the current sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= max) {
      next(new RateLimitedError(message ?? 'Too many requests. Please try again later.'));
      return;
    }

    record.timestamps.push(now);
    next();
  };
}
