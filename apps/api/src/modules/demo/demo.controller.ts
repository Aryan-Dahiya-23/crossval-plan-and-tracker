import type { NextFunction, Request, Response } from 'express';

import { loadAssignmentSample } from './demo.service.js';

export async function handleLoadAssignmentSample(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await loadAssignmentSample(userId);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}
