import type {
  ActualDto,
  ActualsResponse,
  CreateActualRequest,
  ListActualsQuery,
  UpdateActualRequest,
} from '@crossval/contracts';
import { Types } from 'mongoose';

import { runInTransaction } from '../../database/transactions.js';
import { NotFoundError } from '../../http/errors.js';
import { jsonStringToMinor, minorToJsonString } from '../../shared/money.js';
import { apiMonthToDbKey, dbKeyToApiMonth } from '../../shared/month.js';
import { assertActiveCategory } from '../categories/category.service.js';
import { assertPeriodOpenAndCoordinate } from '../periods/period-coordination.service.js';
import { decodeActualCursor, encodeActualCursor } from './actual-cursor.js';
import { ActualModel, type ActualDocument, type IActual } from './actual.model.js';

/**
 * Maps an internal Mongoose Actual document to the public ActualDto.
 */
export function toActualDto(actual: IActual | ActualDocument): ActualDto {
  return {
    id: actual._id.toString(),
    categoryId: actual.categoryId.toString(),
    month: dbKeyToApiMonth(actual.monthKey) as unknown as ActualDto['month'],
    amountMinor: minorToJsonString(actual.amountMinor) as unknown as ActualDto['amountMinor'],
    note: actual.note ?? null,
    createdAt: actual.createdAt.toISOString(),
    updatedAt: actual.updatedAt.toISOString(),
  };
}

/**
 * Creates a new actual expense entry inside a replica-set transaction.
 *
 * Verifies that:
 * 1. The target month financial period is OPEN (coordinates and increments period version).
 * 2. The category is owned by the user and is NOT archived.
 */
export async function createActual(
  userId: Types.ObjectId,
  input: CreateActualRequest,
): Promise<ActualDto> {
  return runInTransaction(async (session) => {
    const monthKey = apiMonthToDbKey(input.month);

    // 1. Transactionally coordinate financial-period state
    await assertPeriodOpenAndCoordinate(userId, monthKey, session);

    // 2. Validate category ownership and active (non-archived) status
    await assertActiveCategory(userId, input.categoryId);

    // 3. Parse amount to integer cents BigInt
    const amountMinor = jsonStringToMinor(input.amountMinor);
    const note = input.note ? input.note.trim() : null;

    const actual = new ActualModel({
      userId,
      categoryId: new Types.ObjectId(input.categoryId),
      monthKey,
      amountMinor,
      note,
    });

    await actual.save({ session });
    return toActualDto(actual);
  });
}

/**
 * Retrieves a single actual entry by ID scoped strictly to the authenticated user.
 * Throws NotFoundError (404) if not found or owned by another user.
 */
export async function getActualById(
  userId: Types.ObjectId,
  actualId: string | Types.ObjectId,
): Promise<ActualDto> {
  const actual = await ActualModel.findOne({ _id: actualId, userId }).exec();

  if (!actual) {
    throw new NotFoundError('Actual entry not found.');
  }

  return toActualDto(actual);
}

/**
 * Lists actual expense entries for an authenticated user with deterministic cursor-based pagination.
 *
 * Sort order: { monthKey: -1, createdAt: -1, _id: -1 }
 */
export async function listActuals(
  userId: Types.ObjectId,
  query: ListActualsQuery,
): Promise<ActualsResponse> {
  const limit =
    typeof query.limit === 'number'
      ? query.limit
      : typeof query.limit === 'string' && query.limit !== ''
        ? Number(query.limit) || 20
        : 20;

  const conditions: Record<string, unknown>[] = [{ userId }];

  if (query.categoryId) {
    conditions.push({ categoryId: new Types.ObjectId(query.categoryId) });
  }

  if (query.month) {
    conditions.push({ monthKey: apiMonthToDbKey(query.month) });
  } else if (query.from && query.to) {
    conditions.push({
      monthKey: {
        $gte: apiMonthToDbKey(query.from),
        $lte: apiMonthToDbKey(query.to),
      },
    });
  }

  if (query.cursor) {
    const decoded = decodeActualCursor(query.cursor);
    if (decoded) {
      conditions.push({
        $or: [
          { monthKey: { $lt: decoded.monthKey } },
          { monthKey: decoded.monthKey, createdAt: { $lt: decoded.createdAt } },
          {
            monthKey: decoded.monthKey,
            createdAt: decoded.createdAt,
            _id: { $lt: decoded.id },
          },
        ],
      });
    }
  }

  const mongoQuery = conditions.length === 1 ? conditions[0]! : { $and: conditions };

  const items = await ActualModel.find(mongoQuery)
    .sort({ monthKey: -1, createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .exec();

  const hasMore = items.length > limit;
  const results = hasMore ? items.slice(0, limit) : items;

  const lastItem = results.length > 0 ? results[results.length - 1] : null;
  const nextCursor =
    hasMore && lastItem
      ? encodeActualCursor(lastItem.monthKey, lastItem.createdAt, lastItem._id)
      : null;

  return {
    data: results.map(toActualDto),
    meta: {
      nextCursor,
      hasMore,
    },
  };
}

/**
 * Updates an owned actual expense entry inside a replica-set transaction.
 *
 * Rules:
 * 1. Target category (if changed) must belong to user and not be archived.
 * 2. If month does NOT change: current month period must be OPEN.
 * 3. If month DOES change (Month Move): BOTH source and destination month periods
 *    must be OPEN. Transaction coordinates both periods in deterministic month-key order.
 */
export async function updateActual(
  userId: Types.ObjectId,
  actualId: string | Types.ObjectId,
  input: UpdateActualRequest,
): Promise<ActualDto> {
  return runInTransaction(async (session) => {
    const actual = await ActualModel.findOne({ _id: actualId, userId }).session(session).exec();

    if (!actual) {
      throw new NotFoundError('Actual entry not found.');
    }

    if (input.categoryId !== undefined) {
      await assertActiveCategory(userId, input.categoryId);
      actual.categoryId = new Types.ObjectId(input.categoryId);
    }

    if (input.month !== undefined) {
      const targetMonthKey = apiMonthToDbKey(input.month);

      if (targetMonthKey !== actual.monthKey) {
        // Month Move: Coordinate BOTH source and destination periods in deterministic order
        const [firstKey, secondKey] = [actual.monthKey, targetMonthKey].sort((a, b) => a - b);
        await assertPeriodOpenAndCoordinate(userId, firstKey!, session);
        await assertPeriodOpenAndCoordinate(userId, secondKey!, session);
        actual.monthKey = targetMonthKey;
      } else {
        // Same month
        await assertPeriodOpenAndCoordinate(userId, actual.monthKey, session);
      }
    } else {
      // Month unchanged: coordinate current month period
      await assertPeriodOpenAndCoordinate(userId, actual.monthKey, session);
    }

    if (input.amountMinor !== undefined) {
      actual.amountMinor = jsonStringToMinor(input.amountMinor);
    }

    if (input.note !== undefined) {
      actual.note = input.note ? input.note.trim() : null;
    }

    await actual.save({ session });
    return toActualDto(actual);
  });
}

/**
 * Deletes an owned actual entry from an open month inside a replica-set transaction.
 * Throws PeriodLockedError (409) if the month is locked.
 */
export async function deleteActual(
  userId: Types.ObjectId,
  actualId: string | Types.ObjectId,
): Promise<void> {
  return runInTransaction(async (session) => {
    const actual = await ActualModel.findOne({ _id: actualId, userId }).session(session).exec();

    if (!actual) {
      throw new NotFoundError('Actual entry not found.');
    }

    await assertPeriodOpenAndCoordinate(userId, actual.monthKey, session);
    await ActualModel.deleteOne({ _id: actual._id, userId }, { session }).exec();
  });
}
