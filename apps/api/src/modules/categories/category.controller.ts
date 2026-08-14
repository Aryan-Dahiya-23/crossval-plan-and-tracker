import type {
  CategoryParams,
  CreateCategoryRequest,
  ListCategoriesQuery,
  UpdateCategoryRequest,
} from '@crossval/contracts';
import type { Request, Response } from 'express';

import {
  archiveCategory,
  createCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from './category.service.js';

export async function handleListCategories(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const query = req.query as unknown as ListCategoriesQuery;
  const categories = await listCategories(userId, {
    includeArchived: query.includeArchived,
  });

  res.status(200).json({ data: categories });
}

export async function handleCreateCategory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const body = req.body as CreateCategoryRequest;
  const category = await createCategory(userId, body);

  res.status(201).json({ data: category });
}

export async function handleGetCategory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const params = req.params as unknown as CategoryParams;
  const category = await getCategoryById(userId, params.id);

  res.status(200).json({ data: category });
}

export async function handleUpdateCategory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const params = req.params as unknown as CategoryParams;
  const body = req.body as UpdateCategoryRequest;
  const category = await updateCategory(userId, params.id, body);

  res.status(200).json({ data: category });
}

export async function handleArchiveCategory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const params = req.params as unknown as CategoryParams;
  const category = await archiveCategory(userId, params.id);

  res.status(200).json({ data: category });
}
