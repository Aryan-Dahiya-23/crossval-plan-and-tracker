import {
  batchPlanParamsSchema,
  batchPlanRequestSchema,
  deletePlanParamsSchema,
  listPlansQuerySchema,
  putPlanParamsSchema,
  putPlanRequestSchema,
} from '@crossval/contracts';
import { Router } from 'express';

import { requireAuth, validate } from '../../http/middleware/index.js';
import {
  handleBatchUpdatePlans,
  handleDeletePlan,
  handleGetPlans,
  handlePutPlan,
} from './plan.controller.js';

export function createPlanRouter(): Router {
  const router = Router();

  // All plan endpoints require authentication
  router.use(requireAuth);

  router.get('/', validate({ query: listPlansQuerySchema }), (req, res, next) => {
    void handleGetPlans(req, res).catch(next);
  });

  router.patch(
    '/months/:month',
    validate({
      params: batchPlanParamsSchema,
      body: batchPlanRequestSchema,
    }),
    (req, res, next) => {
      void handleBatchUpdatePlans(req, res).catch(next);
    },
  );

  router.put(
    '/:categoryId/:month',
    validate({
      params: putPlanParamsSchema,
      body: putPlanRequestSchema,
    }),
    (req, res, next) => {
      void handlePutPlan(req, res).catch(next);
    },
  );

  router.delete(
    '/:categoryId/:month',
    validate({
      params: deletePlanParamsSchema,
    }),
    (req, res, next) => {
      void handleDeletePlan(req, res).catch(next);
    },
  );

  return router;
}
