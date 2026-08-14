import {
  actualParamsSchema,
  createActualRequestSchema,
  listActualsQuerySchema,
  updateActualRequestSchema,
} from '@crossval/contracts';
import { Router } from 'express';

import { requireAuth, validate } from '../../http/middleware/index.js';
import {
  handleCreateActual,
  handleDeleteActual,
  handleGetActual,
  handleListActuals,
  handleUpdateActual,
} from './actual.controller.js';

export function createActualRouter(): Router {
  const router = Router();

  // All actual endpoints require authentication
  router.use(requireAuth);

  // POST /v1/actuals
  router.post('/', validate({ body: createActualRequestSchema }), handleCreateActual);

  // GET /v1/actuals
  router.get('/', validate({ query: listActualsQuerySchema }), handleListActuals);

  // GET /v1/actuals/:id
  router.get('/:id', validate({ params: actualParamsSchema }), handleGetActual);

  // PATCH /v1/actuals/:id
  router.patch(
    '/:id',
    validate({ params: actualParamsSchema, body: updateActualRequestSchema }),
    handleUpdateActual,
  );

  // DELETE /v1/actuals/:id
  router.delete('/:id', validate({ params: actualParamsSchema }), handleDeleteActual);

  return router;
}
