import { Router } from 'express';

import { createActualRouter } from '../modules/actuals/actual.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createCategoryRouter } from '../modules/categories/category.routes.js';
import { createDemoRouter } from '../modules/demo/demo.routes.js';
import { createPeriodRouter } from '../modules/periods/period.routes.js';
import { createPlanRouter } from '../modules/plans/plan.routes.js';
import { createReportRouter } from '../modules/reports/report.routes.js';

/**
 * Top-level /v1 API router.
 * Domain routers (auth, categories, plans, actuals, periods, reports, demo)
 * are mounted here.
 */
export function createV1Router(): Router {
  const router = Router();

  router.use('/auth', createAuthRouter());
  router.use('/categories', createCategoryRouter());
  router.use('/plans', createPlanRouter());
  router.use('/actuals', createActualRouter());
  router.use('/periods', createPeriodRouter());
  router.use('/reports', createReportRouter());
  router.use('/demo', createDemoRouter());

  return router;
}
