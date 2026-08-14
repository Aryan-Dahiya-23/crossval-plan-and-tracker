import { healthResponseSchema, readyResponseSchema } from '@crossval/contracts';
import cookieParser from 'cookie-parser';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';

import { isDatabaseConnected } from './database/connection.js';
import {
  authenticate,
  createOriginGuard,
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from './http/middleware/index.js';
import { createV1Router } from './http/router.js';

export interface AppConfig {
  corsOrigins?: string[] | undefined;
}

export function createApp(config: AppConfig = {}): Express {
  const { corsOrigins = ['http://localhost:3000'] } = config;
  const app = express();

  // 1. Disable fingerprinting headers
  app.disable('x-powered-by');

  // 2. Attach Request ID to every request/response
  app.use(requestIdMiddleware);

  // 3. Security headers middleware
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // 4. CORS middleware with exact origin matching
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Request-Id, Cookie',
      );
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  // 5. Origin guard on mutations
  app.use(createOriginGuard({ allowedOrigins: corsOrigins }));

  // 6. Body & cookie parsing
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // 7. Extract & validate session if present (non-blocking)
  app.use(authenticate);

  // 8. Health checks
  // 8a. Liveness probe (does not check database; proves process is responding)
  app.get('/health/live', (_req: Request, res: Response) => {
    const payload = healthResponseSchema.parse({
      service: 'api',
      status: 'ok',
    });

    res.status(200).json(payload);
  });

  // 8b. Readiness probe (verifies database connectivity)
  app.get('/health/ready', (_req: Request, res: Response) => {
    const connected = isDatabaseConnected();
    const statusCode = connected ? 200 : 503;

    const payload = readyResponseSchema.parse({
      service: 'api',
      status: connected ? 'ok' : 'degraded',
      database: connected ? 'connected' : 'disconnected',
    });

    res.status(statusCode).json(payload);
  });

  // 9. Mount /v1 API routes
  app.use('/v1', createV1Router());

  // 10. Catch unmatched routes with 404
  app.use(notFoundHandler);

  // 11. Global centralized error handler
  app.use(errorHandler);

  return app;
}
