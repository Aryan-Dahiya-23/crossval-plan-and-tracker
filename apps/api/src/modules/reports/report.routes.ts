import { getReportQuerySchema } from '@crossval/contracts';
import { Router } from 'express';

import { requireAuth, validate } from '../../http/middleware/index.js';
import { handleGetPlanVsActualReport } from './report.controller.js';

export function createReportRouter(): Router {
  const router = Router();

  // All report endpoints require authentication
  router.use(requireAuth);

  // GET /v1/reports/plan-vs-actual?from=YYYY-MM&to=YYYY-MM
  router.get(
    '/plan-vs-actual',
    validate({ query: getReportQuerySchema }),
    handleGetPlanVsActualReport,
  );

  return router;
}
