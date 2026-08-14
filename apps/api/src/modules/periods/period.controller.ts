import type { ListPeriodsQuery, LockPeriodParams } from '@crossval/contracts';
import type { NextFunction, Request, Response } from 'express';

import { getPeriod, listPeriods, lockPeriod } from './period.service.js';

export async function handleLockPeriod(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { month } = req.params as unknown as LockPeriodParams;
    const period = await lockPeriod(userId, month);
    res.status(200).json({ data: period });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPeriod(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { month } = req.params as unknown as LockPeriodParams;
    const period = await getPeriod(userId, month);
    res.status(200).json({ data: period });
  } catch (err) {
    next(err);
  }
}

export async function handleListPeriods(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as ListPeriodsQuery;
    const periods = await listPeriods(userId, query);
    res.status(200).json({ data: periods });
  } catch (err) {
    next(err);
  }
}
