import type { ClientSession, Types } from 'mongoose';

import { PeriodLockedError } from '../../http/errors.js';
import { FinancialPeriodModel, type FinancialPeriodDocument } from './financial-period.model.js';

/**
 * Coordinates and validates the financial-period locking state inside a MongoDB transaction.
 *
 * Atomically increments the period version (creating an OPEN period record on first write)
 * to serialize against concurrent lock operations.
 *
 * Throws PeriodLockedError (409) if the month's financial period is LOCKED.
 */
export async function assertPeriodOpenAndCoordinate(
  userId: Types.ObjectId,
  monthKey: number,
  session: ClientSession,
): Promise<FinancialPeriodDocument> {
  const period = await FinancialPeriodModel.findOneAndUpdate(
    { userId, monthKey },
    {
      $inc: { version: 1 },
      $setOnInsert: {
        status: 'OPEN',
        lockedAt: null,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      session,
    },
  ).exec();

  if (!period || period.status === 'LOCKED') {
    throw new PeriodLockedError();
  }

  return period;
}

/**
 * Checks whether a given month key is locked for a user (read-only query).
 */
export async function isPeriodLocked(userId: Types.ObjectId, monthKey: number): Promise<boolean> {
  const period = await FinancialPeriodModel.findOne({ userId, monthKey }).exec();
  return period?.status === 'LOCKED';
}
