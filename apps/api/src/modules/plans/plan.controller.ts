import type {
  BatchPlanParams,
  BatchPlanRequest,
  DeletePlanParams,
  ListPlansQuery,
  PutPlanParams,
  PutPlanRequest,
} from '@crossval/contracts';
import type { Request, Response } from 'express';

import { batchUpdatePlans, deletePlan, getPlans, upsertPlan } from './plan.service.js';

export async function handleGetPlans(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const query = req.query as unknown as ListPlansQuery;
  const plans = await getPlans(userId, query);

  res.status(200).json({ data: plans });
}

export async function handlePutPlan(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const params = req.params as unknown as PutPlanParams;
  const body = req.body as PutPlanRequest;
  const plan = await upsertPlan(userId, params.categoryId, params.month, body);

  res.status(200).json({ data: plan });
}

export async function handleDeletePlan(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const params = req.params as unknown as DeletePlanParams;
  await deletePlan(userId, params.categoryId, params.month);

  res.status(204).end();
}

export async function handleBatchUpdatePlans(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const params = req.params as unknown as BatchPlanParams;
  const body = req.body as BatchPlanRequest;
  const plans = await batchUpdatePlans(userId, params.month, body);

  res.status(200).json({ data: plans });
}
