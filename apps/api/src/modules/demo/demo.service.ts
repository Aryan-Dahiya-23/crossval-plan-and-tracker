import type { LoadDemoSampleDataDto, MonthString } from '@crossval/contracts';
import type { Types } from 'mongoose';

import { runInTransaction } from '../../database/transactions.js';
import { SampleDataNotAvailableError } from '../../http/errors.js';
import { ActualModel } from '../actuals/actual.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { PlanModel } from '../plans/plan.model.js';

/**
 * Loads the canonical assignment sample dataset for a user account.
 *
 * Guard:
 * The account must have 0 plans, 0 actual entries, and 0 locked financial periods.
 * If any of these exist, throws SampleDataNotAvailableError (409).
 *
 * Persists transactionally:
 * - 4 Plans:
 *   - Marketing 2026-01: $5,000.00 (500000n)
 *   - Payroll 2026-01: $20,000.00 (2000000n)
 *   - Marketing 2026-02: $5,000.00 (500000n)
 *   - Payroll 2026-02: $20,000.00 (2000000n)
 * - 5 Actual Entries:
 *   - Marketing 2026-01: Google Ads $2,000.00 (200000n)
 *   - Marketing 2026-01: LinkedIn $1,000.00 (100000n)
 *   - Marketing 2026-01: Agency $1,800.00 (180000n)
 *   - Payroll 2026-01: Salaries $20,500.00 (2050000n)
 *   - Payroll 2026-02: Salaries $19,800.00 (1980000n)
 */
export async function loadAssignmentSample(userId: Types.ObjectId): Promise<LoadDemoSampleDataDto> {
  // Check clean account invariant
  const [plansCount, actualsCount, lockedPeriodsCount] = await Promise.all([
    PlanModel.countDocuments({ userId }).exec(),
    ActualModel.countDocuments({ userId }).exec(),
    FinancialPeriodModel.countDocuments({ userId, status: 'LOCKED' }).exec(),
  ]);

  if (plansCount > 0 || actualsCount > 0 || lockedPeriodsCount > 0) {
    throw new SampleDataNotAvailableError(
      'Sample data cannot be loaded because account already contains plans, actuals, or locked periods.',
    );
  }

  return runInTransaction(async (session) => {
    // Find or create Marketing category
    let marketing = await CategoryModel.findOne({
      userId,
      nameCanonical: 'marketing',
    })
      .session(session)
      .exec();

    if (!marketing) {
      const created = await CategoryModel.create(
        [
          {
            userId,
            name: 'Marketing',
            nameCanonical: 'marketing',
            colorKey: 'purple',
            archivedAt: null,
          },
        ],
        { session, ordered: true },
      );
      marketing = created[0]!;
    }

    // Find or create Payroll category
    let payroll = await CategoryModel.findOne({
      userId,
      nameCanonical: 'payroll',
    })
      .session(session)
      .exec();

    if (!payroll) {
      const created = await CategoryModel.create(
        [
          {
            userId,
            name: 'Payroll',
            nameCanonical: 'payroll',
            colorKey: 'emerald',
            archivedAt: null,
          },
        ],
        { session, ordered: true },
      );
      payroll = created[0]!;
    }

    // Create 4 plans
    await PlanModel.create(
      [
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 500_000n,
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202601,
          amountMinor: 2_000_000n,
        },
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202602,
          amountMinor: 500_000n,
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202602,
          amountMinor: 2_000_000n,
        },
      ],
      { session, ordered: true },
    );

    // Create 5 actuals
    await ActualModel.create(
      [
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 200_000n,
          note: 'Google Ads',
        },
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 100_000n,
          note: 'LinkedIn',
        },
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 180_000n,
          note: 'Agency',
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202601,
          amountMinor: 2_050_000n,
          note: 'Salaries',
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202602,
          amountMinor: 1_980_000n,
          note: 'Salaries',
        },
      ],
      { session, ordered: true },
    );

    return {
      plansCreated: 4,
      actualsCreated: 5,
      range: {
        from: '2026-01' as unknown as MonthString,
        to: '2026-02' as unknown as MonthString,
      },
    };
  });
}
