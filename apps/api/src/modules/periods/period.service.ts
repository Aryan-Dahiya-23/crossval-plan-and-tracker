import type { FinancialPeriodDto, ListPeriodsQuery } from '@crossval/contracts';
import type { Types } from 'mongoose';

import { runInTransaction } from '../../database/transactions.js';
import { PeriodAlreadyLockedError } from '../../http/errors.js';
import { apiMonthToDbKey, dbKeyToApiMonth, monthRange } from '../../shared/month.js';
import {
  FinancialPeriodModel,
  type FinancialPeriodDocument,
  type IFinancialPeriod,
} from './financial-period.model.js';

/**
 * Maps an internal Mongoose FinancialPeriod document to the public FinancialPeriodDto.
 */
export function toFinancialPeriodDto(
  period: IFinancialPeriod | FinancialPeriodDocument,
): FinancialPeriodDto {
  return {
    id: period._id.toString(),
    month: dbKeyToApiMonth(period.monthKey) as unknown as FinancialPeriodDto['month'],
    status: period.status,
    lockedAt: period.lockedAt ? period.lockedAt.toISOString() : null,
    createdAt: period.createdAt ? period.createdAt.toISOString() : null,
    updatedAt: period.updatedAt ? period.updatedAt.toISOString() : null,
  };
}

/**
 * Irreversibly locks a financial period for a user and month inside a transaction.
 *
 * Invariants:
 * 1. If already LOCKED, aborts transaction and throws PeriodAlreadyLockedError (409).
 * 2. If OPEN, transitions status to LOCKED, sets lockedAt timestamp, increments version.
 * 3. If uncoordinated, creates record with status LOCKED, lockedAt timestamp, version 1.
 */
export async function lockPeriod(
  userId: Types.ObjectId,
  monthStr: string,
): Promise<FinancialPeriodDto> {
  return runInTransaction(async (session) => {
    const monthKey = apiMonthToDbKey(monthStr);

    const existing = await FinancialPeriodModel.findOne({ userId, monthKey })
      .session(session)
      .exec();

    if (existing && existing.status === 'LOCKED') {
      throw new PeriodAlreadyLockedError();
    }

    if (existing) {
      existing.status = 'LOCKED';
      existing.lockedAt = new Date();
      existing.version += 1;
      await existing.save({ session });
      return toFinancialPeriodDto(existing);
    }

    const period = new FinancialPeriodModel({
      userId,
      monthKey,
      status: 'LOCKED',
      version: 1,
      lockedAt: new Date(),
    });

    await period.save({ session });
    return toFinancialPeriodDto(period);
  });
}

/**
 * Retrieves the financial period for a single month.
 * If no record exists in the database, returns an implicit OPEN period.
 */
export async function getPeriod(
  userId: Types.ObjectId,
  monthStr: string,
): Promise<FinancialPeriodDto> {
  const monthKey = apiMonthToDbKey(monthStr);
  const period = await FinancialPeriodModel.findOne({ userId, monthKey }).exec();

  if (period) {
    return toFinancialPeriodDto(period);
  }

  return {
    id: null,
    month: monthStr as unknown as FinancialPeriodDto['month'],
    status: 'OPEN',
    lockedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Retrieves financial periods across an inclusive month range.
 * Merges stored period records with implicit OPEN states for uncoordinated months.
 * Returns array sorted by month ascending.
 */
export async function listPeriods(
  userId: Types.ObjectId,
  query: ListPeriodsQuery,
): Promise<FinancialPeriodDto[]> {
  const fromKey = apiMonthToDbKey(query.from);
  const toKey = apiMonthToDbKey(query.to);
  const keys = monthRange(fromKey, toKey);

  const stored = await FinancialPeriodModel.find({
    userId,
    monthKey: { $in: keys },
  }).exec();

  const storedMap = new Map<number, FinancialPeriodDocument>();
  for (const doc of stored) {
    storedMap.set(doc.monthKey, doc);
  }

  return keys.map((key) => {
    const doc = storedMap.get(key);
    if (doc) {
      return toFinancialPeriodDto(doc);
    }

    return {
      id: null,
      month: dbKeyToApiMonth(key) as unknown as FinancialPeriodDto['month'],
      status: 'OPEN',
      lockedAt: null,
      createdAt: null,
      updatedAt: null,
    };
  });
}
