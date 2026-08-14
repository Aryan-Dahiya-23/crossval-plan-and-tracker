import type {
  GetReportQuery,
  MoneyMinorString,
  MonthString,
  ReportCategoryItemDto,
  ReportCategoryMonthItemDto,
  ReportDto,
  ReportMonthlySeriesItemDto,
  SignedMoneyMinorString,
} from '@crossval/contracts';
import { Types } from 'mongoose';

import {
  calculateVariance,
  calculateVariancePercent,
  minorToJsonString,
} from '../../shared/money.js';
import { apiMonthToDbKey, dbKeyToApiMonth, monthRange } from '../../shared/month.js';
import { ActualModel } from '../actuals/actual.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { PlanModel } from '../plans/plan.model.js';

interface ActualAggregationResult {
  _id: { categoryId: Types.ObjectId; monthKey: number };
  totalAmount: bigint | number;
  count: number;
}

/**
 * Authoritative business calculation engine for Plan vs Actual Reporting.
 *
 * Implements:
 * - Parallel user-scoped queries across categories, plans, actuals, and period locks.
 * - Missing plan zero-filling (hasPlan = false, planMinor = "0").
 * - Missing actual zero-filling (actualMinor = "0", actualEntryCount = 0).
 * - Exact BigInt variance calculations (actualMinor - planMinor).
 * - BigInt half-away-from-zero percentage calculations without floating-point math.
 * - Category subtotals and overall totals aggregated from sums (not averaged).
 * - overPlanCategoryCount counting categories where aggregate range variance > 0.
 * - Lock flags for each month.
 */
export async function getPlanVsActualReport(
  userId: Types.ObjectId,
  query: GetReportQuery,
): Promise<ReportDto> {
  const fromKey = apiMonthToDbKey(query.from);
  const toKey = apiMonthToDbKey(query.to);
  const keys = monthRange(fromKey, toKey);

  // Normalize category filter
  let categoryFilterIds: string[] | null = null;
  if (query.categoryId) {
    if (Array.isArray(query.categoryId)) {
      categoryFilterIds = query.categoryId;
    } else if (typeof query.categoryId === 'string') {
      categoryFilterIds = query.categoryId.split(',').map((id) => id.trim());
    }
  }

  const categoryFilterSet = categoryFilterIds ? new Set(categoryFilterIds) : null;

  // Run database queries in parallel
  const [categories, plans, actualsAgg, periodDocs] = await Promise.all([
    CategoryModel.find({ userId }).sort({ nameCanonical: 1 }).exec(),
    PlanModel.find({
      userId,
      monthKey: { $gte: fromKey, $lte: toKey },
    }).exec(),
    ActualModel.aggregate<ActualAggregationResult>([
      {
        $match: {
          userId,
          monthKey: { $gte: fromKey, $lte: toKey },
        },
      },
      {
        $group: {
          _id: { categoryId: '$categoryId', monthKey: '$monthKey' },
          totalAmount: { $sum: '$amountMinor' },
          count: { $sum: 1 },
        },
      },
    ]),
    FinancialPeriodModel.find({
      userId,
      monthKey: { $gte: fromKey, $lte: toKey },
    }).exec(),
  ]);

  // Index plans by `${categoryId}:${monthKey}`
  const plansMap = new Map<string, bigint>();
  const hasPlanMap = new Map<string, boolean>();
  for (const p of plans) {
    const key = `${p.categoryId.toString()}:${p.monthKey}`;
    plansMap.set(key, p.amountMinor);
    hasPlanMap.set(key, true);
  }

  // Index aggregated actuals by `${categoryId}:${monthKey}`
  const actualsMap = new Map<string, { totalAmount: bigint; count: number }>();
  for (const a of actualsAgg) {
    const key = `${a._id.categoryId.toString()}:${a._id.monthKey}`;
    actualsMap.set(key, {
      totalAmount: BigInt(a.totalAmount),
      count: a.count,
    });
  }

  // Index period locks by `monthKey`
  const periodLocksMap = new Map<number, boolean>();
  for (const pd of periodDocs) {
    periodLocksMap.set(pd.monthKey, pd.status === 'LOCKED');
  }

  // Determine which categories to include
  const includedCategories = categories.filter((cat) => {
    const catIdStr = cat._id.toString();

    // If explicit filter is provided, respect it strictly
    if (categoryFilterSet) {
      return categoryFilterSet.has(catIdStr);
    }

    // Active categories are included
    if (cat.archivedAt === null) {
      return true;
    }

    // Archived categories are included ONLY if they have data in this range
    for (const k of keys) {
      const key = `${catIdStr}:${k}`;
      if (hasPlanMap.has(key) || actualsMap.has(key)) {
        return true;
      }
    }

    return false;
  });

  // Track totals and monthly sums
  let overallPlanTotal = 0n;
  let overallActualTotal = 0n;
  let overPlanCategoryCount = 0;

  const monthlyPlansMap = new Map<number, bigint>();
  const monthlyActualsMap = new Map<number, bigint>();
  for (const k of keys) {
    monthlyPlansMap.set(k, 0n);
    monthlyActualsMap.set(k, 0n);
  }

  const categoryItems: ReportCategoryItemDto[] = [];

  for (const cat of includedCategories) {
    const catIdStr = cat._id.toString();
    let catPlanTotal = 0n;
    let catActualTotal = 0n;
    const monthCells: ReportCategoryMonthItemDto[] = [];

    for (const k of keys) {
      const monthStr = dbKeyToApiMonth(k) as unknown as MonthString;
      const isLocked = periodLocksMap.get(k) === true;
      const key = `${catIdStr}:${k}`;

      const hasPlan = hasPlanMap.get(key) === true;
      const planMinor = plansMap.get(key) ?? 0n;

      const actualEntry = actualsMap.get(key);
      const actualMinor = actualEntry?.totalAmount ?? 0n;
      const actualEntryCount = actualEntry?.count ?? 0;

      const varianceMinor = calculateVariance(actualMinor, planMinor);
      const variancePercent = calculateVariancePercent(varianceMinor, planMinor);

      catPlanTotal += planMinor;
      catActualTotal += actualMinor;

      monthlyPlansMap.set(k, (monthlyPlansMap.get(k) ?? 0n) + planMinor);
      monthlyActualsMap.set(k, (monthlyActualsMap.get(k) ?? 0n) + actualMinor);

      monthCells.push({
        month: monthStr,
        hasPlan,
        planMinor: minorToJsonString(planMinor) as unknown as MoneyMinorString,
        actualMinor: minorToJsonString(actualMinor) as unknown as MoneyMinorString,
        varianceMinor: minorToJsonString(varianceMinor) as unknown as SignedMoneyMinorString,
        variancePercent,
        actualEntryCount,
        locked: isLocked,
      });
    }

    const catVarianceMinor = calculateVariance(catActualTotal, catPlanTotal);
    const catVariancePercent = calculateVariancePercent(catVarianceMinor, catPlanTotal);

    if (catVarianceMinor > 0n) {
      overPlanCategoryCount++;
    }

    overallPlanTotal += catPlanTotal;
    overallActualTotal += catActualTotal;

    categoryItems.push({
      category: {
        id: catIdStr,
        name: cat.name,
        colorKey: cat.colorKey,
      },
      subtotal: {
        planMinor: minorToJsonString(catPlanTotal) as unknown as MoneyMinorString,
        actualMinor: minorToJsonString(catActualTotal) as unknown as MoneyMinorString,
        varianceMinor: minorToJsonString(catVarianceMinor) as unknown as SignedMoneyMinorString,
        variancePercent: catVariancePercent,
      },
      months: monthCells,
    });
  }

  // Monthly series across all requested months
  const monthlySeries: ReportMonthlySeriesItemDto[] = keys.map((k) => {
    const monthStr = dbKeyToApiMonth(k) as unknown as MonthString;
    const planMinor = monthlyPlansMap.get(k) ?? 0n;
    const actualMinor = monthlyActualsMap.get(k) ?? 0n;
    const varianceMinor = calculateVariance(actualMinor, planMinor);
    const isLocked = periodLocksMap.get(k) === true;

    return {
      month: monthStr,
      planMinor: minorToJsonString(planMinor) as unknown as MoneyMinorString,
      actualMinor: minorToJsonString(actualMinor) as unknown as MoneyMinorString,
      varianceMinor: minorToJsonString(varianceMinor) as unknown as SignedMoneyMinorString,
      locked: isLocked,
    };
  });

  // Top-level KPI summary
  const overallVarianceMinor = calculateVariance(overallActualTotal, overallPlanTotal);
  const overallVariancePercent = calculateVariancePercent(overallVarianceMinor, overallPlanTotal);

  return {
    range: {
      from: query.from as unknown as MonthString,
      to: query.to as unknown as MonthString,
    },
    summary: {
      planMinor: minorToJsonString(overallPlanTotal) as unknown as MoneyMinorString,
      actualMinor: minorToJsonString(overallActualTotal) as unknown as MoneyMinorString,
      varianceMinor: minorToJsonString(overallVarianceMinor) as unknown as SignedMoneyMinorString,
      variancePercent: overallVariancePercent,
      overPlanCategoryCount,
    },
    monthlySeries,
    categories: categoryItems,
  };
}
