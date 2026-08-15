import type {
  ActualParams,
  CreateActualRequest,
  ImportActualsRequest,
  ListActualsQuery,
  UpdateActualRequest,
} from '@crossval/contracts';
import type { NextFunction, Request, Response } from 'express';

import {
  createActual,
  deleteActual,
  getActualById,
  importActuals,
  listActuals,
  updateActual,
} from './actual.service.js';

export async function handleCreateActual(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body = req.body as CreateActualRequest;
    const actual = await createActual(userId, body);
    res.status(201).json({ data: actual });
  } catch (err) {
    next(err);
  }
}

export async function handleImportActuals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body = req.body as ImportActualsRequest;
    const result = await importActuals(userId, body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleListActuals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as ListActualsQuery;
    const result = await listActuals(userId, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetActual(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as unknown as ActualParams;
    const actual = await getActualById(userId, id);
    res.status(200).json({ data: actual });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateActual(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as unknown as ActualParams;
    const body = req.body as UpdateActualRequest;
    const actual = await updateActual(userId, id, body);
    res.status(200).json({ data: actual });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteActual(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as unknown as ActualParams;
    await deleteActual(userId, id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
