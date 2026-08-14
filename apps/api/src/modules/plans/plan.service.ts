import type {
  BatchPlanRequest,
  ListPlansQuery,
  PlanDto,
  PutPlanRequest,
} from '@crossval/contracts';
import type { Types } from 'mongoose';

import { runInTransaction } from '../../database/transactions.js';
import { jsonStringToMinor, minorToJsonString } from '../../shared/money.js';
import { apiMonthToDbKey, dbKeyToApiMonth } from '../../shared/month.js';
import { assertActiveCategory, getCategoryById } from '../categories/category.service.js';
import { assertPeriodOpenAndCoordinate } from '../periods/period-coordination.service.js';
import { PlanModel, type IPlan } from './plan.model.js';

/**
 * Maps an internal Mongoose Plan document to the public PlanDto.
 */
export function toPlanDto(plan: IPlan): PlanDto {
  return {
    id: plan._id.toString(),
    categoryId: plan.categoryId.toString(),
    month: dbKeyToApiMonth(plan.monthKey) as unknown as PlanDto['month'],
    amountMinor: minorToJsonString(plan.amountMinor) as unknown as PlanDto['amountMinor'],
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * Retrieves plans within an inclusive month range for an authenticated user,
 * optionally filtered by category.
 */
export async function getPlans(userId: Types.ObjectId, query: ListPlansQuery): Promise<PlanDto[]> {
  const fromKey = apiMonthToDbKey(query.from);
  const toKey = apiMonthToDbKey(query.to);

  const filter: Record<string, unknown> = {
    userId,
    monthKey: { $gte: fromKey, $lte: toKey },
  };

  if (query.categoryId) {
    filter['categoryId'] = query.categoryId;
  }

  const plans = await PlanModel.find(filter).sort({ monthKey: 1, categoryId: 1 }).exec();

  return plans.map(toPlanDto);
}

/**
 * Creates or updates a single plan target for a category and month.
 * Transactionally coordinates period lock status and verifies category is active.
 */
export async function upsertPlan(
  userId: Types.ObjectId,
  categoryId: string | Types.ObjectId,
  monthStr: string,
  input: PutPlanRequest,
): Promise<PlanDto> {
  const monthKey = apiMonthToDbKey(monthStr);
  const amountMinor = jsonStringToMinor(input.amountMinor);

  return runInTransaction(async (session) => {
    // 1. Transactionally coordinate period status (throws 409 if locked)
    await assertPeriodOpenAndCoordinate(userId, monthKey, session);

    // 2. Verify category exists, is owned by user, and is active (throws 404 or 409)
    await assertActiveCategory(userId, categoryId);

    // 3. Upsert plan document
    const plan = await PlanModel.findOneAndUpdate(
      { userId, categoryId, monthKey },
      { $set: { amountMinor } },
      {
        upsert: true,
        returnDocument: 'after',
        session,
      },
    ).exec();

    return toPlanDto(plan!);
  });
}

/**
 * Clears/deletes a plan target for a category and month.
 * Transactionally coordinates period lock status and verifies category existence.
 */
export async function deletePlan(
  userId: Types.ObjectId,
  categoryId: string | Types.ObjectId,
  monthStr: string,
): Promise<void> {
  const monthKey = apiMonthToDbKey(monthStr);

  await runInTransaction(async (session) => {
    // 1. Coordinate period status
    await assertPeriodOpenAndCoordinate(userId, monthKey, session);

    // 2. Verify category exists and belongs to user (throws 404 if not found)
    await getCategoryById(userId, categoryId);

    // 3. Delete plan document
    await PlanModel.deleteOne({ userId, categoryId, monthKey }, { session }).exec();
  });
}

/**
 * Atomically creates, replaces, or clears multiple category plans for a month.
 * If any single item fails (e.g. archived category), the entire transaction rolls back.
 */
export async function batchUpdatePlans(
  userId: Types.ObjectId,
  monthStr: string,
  input: BatchPlanRequest,
): Promise<PlanDto[]> {
  const monthKey = apiMonthToDbKey(monthStr);

  return runInTransaction(async (session) => {
    // 1. Coordinate period status
    await assertPeriodOpenAndCoordinate(userId, monthKey, session);

    // 2. Process changes sequentially inside transaction (no Promise.all)
    for (const change of input.changes) {
      if (change.amountMinor === null) {
        // Clear/delete plan
        await getCategoryById(userId, change.categoryId);
        await PlanModel.deleteOne(
          { userId, categoryId: change.categoryId, monthKey },
          { session },
        ).exec();
      } else {
        // Upsert plan
        await assertActiveCategory(userId, change.categoryId);
        const amountMinor = jsonStringToMinor(change.amountMinor);
        await PlanModel.findOneAndUpdate(
          { userId, categoryId: change.categoryId, monthKey },
          { $set: { amountMinor } },
          {
            upsert: true,
            returnDocument: 'after',
            session,
          },
        ).exec();
      }
    }

    // 3. Return resulting active plans for this month
    const resultingPlans = await PlanModel.find({ userId, monthKey })
      .sort({ categoryId: 1 })
      .session(session)
      .exec();

    return resultingPlans.map(toPlanDto);
  });
}
