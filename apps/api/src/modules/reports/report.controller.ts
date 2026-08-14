import type { GetReportQuery } from '@crossval/contracts';
import type { NextFunction, Request, Response } from 'express';

import { getPlanVsActualReport } from './report.service.js';

export async function handleGetPlanVsActualReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as GetReportQuery;
    const report = await getPlanVsActualReport(userId, query);
    res.status(200).json({ data: report });
  } catch (err) {
    next(err);
  }
}
