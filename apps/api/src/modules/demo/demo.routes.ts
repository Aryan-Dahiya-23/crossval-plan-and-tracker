import { Router } from 'express';

import { requireAuth } from '../../http/middleware/index.js';
import { handleLoadAssignmentSample } from './demo.controller.js';

export function createDemoRouter(): Router {
  const router = Router();

  // All demo endpoints require authentication
  router.use(requireAuth);

  // POST /v1/demo/assignment-sample
  router.post('/assignment-sample', handleLoadAssignmentSample);

  return router;
}
