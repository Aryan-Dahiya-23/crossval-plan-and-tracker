import { listPeriodsQuerySchema, lockPeriodParamsSchema } from '@crossval/contracts';
import { Router } from 'express';

import { requireAuth, validate } from '../../http/middleware/index.js';
import { handleGetPeriod, handleListPeriods, handleLockPeriod } from './period.controller.js';

export function createPeriodRouter(): Router {
  const router = Router();

  // All period endpoints require authentication
  router.use(requireAuth);

  // GET /v1/periods?from=YYYY-MM&to=YYYY-MM
  router.get('/', validate({ query: listPeriodsQuerySchema }), handleListPeriods);

  // POST /v1/periods/:month/lock
  router.post('/:month/lock', validate({ params: lockPeriodParamsSchema }), handleLockPeriod);

  // GET /v1/periods/:month
  router.get('/:month', validate({ params: lockPeriodParamsSchema }), handleGetPeriod);

  return router;
}
