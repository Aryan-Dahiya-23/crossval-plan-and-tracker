import {
  categoryParamsSchema,
  createCategoryRequestSchema,
  listCategoriesQuerySchema,
  updateCategoryRequestSchema,
} from '@crossval/contracts';
import { Router } from 'express';

import { requireAuth, validate } from '../../http/middleware/index.js';
import {
  handleArchiveCategory,
  handleCreateCategory,
  handleGetCategory,
  handleListCategories,
  handleUpdateCategory,
} from './category.controller.js';

export function createCategoryRouter(): Router {
  const router = Router();

  // All category endpoints require authenticated user session
  router.use(requireAuth);

  router.get('/', validate({ query: listCategoriesQuerySchema }), (req, res, next) => {
    void handleListCategories(req, res).catch(next);
  });

  router.post('/', validate({ body: createCategoryRequestSchema }), (req, res, next) => {
    void handleCreateCategory(req, res).catch(next);
  });

  router.get('/:id', validate({ params: categoryParamsSchema }), (req, res, next) => {
    void handleGetCategory(req, res).catch(next);
  });

  router.patch(
    '/:id',
    validate({
      params: categoryParamsSchema,
      body: updateCategoryRequestSchema,
    }),
    (req, res, next) => {
      void handleUpdateCategory(req, res).catch(next);
    },
  );

  router.post('/:id/archive', validate({ params: categoryParamsSchema }), (req, res, next) => {
    void handleArchiveCategory(req, res).catch(next);
  });

  return router;
}
