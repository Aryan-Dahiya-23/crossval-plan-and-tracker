import type { LoadDemoSampleDataDto, MonthString } from '@crossval/contracts';
import type { Types } from 'mongoose';

import { runInTransaction } from '../../database/transactions.js';
import { SampleDataNotAvailableError } from '../../http/errors.js';
import { ActualModel } from '../actuals/actual.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { PlanModel } from '../plans/plan.model.js';

/**
 * Loads the canonical assignment sample dataset for a user account with granular line-item entries.
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
 * - 10 Granular Actual Entries:
 *   - Marketing 2026-01 ($4,800.00 total):
 *       - Google Search & Display Ads $2,000.00 (200000n)
 *       - LinkedIn Sponsored Campaigns $1,000.00 (100000n)
 *       - Creative Agency Retainer $1,200.00 (120000n)
 *       - Brand Design Contractor $600.00 (60000n)
 *   - Payroll 2026-01 ($20,500.00 total):
 *       - Engineering Team Base Salaries $14,000.00 (1400000n)
 *       - Product & Design Salaries $4,500.00 (450000n)
 *       - Healthcare & Dental Benefits $2,000.00 (200000n)
 *   - Marketing 2026-02 ($0.00 total):
 *       - [Intentionally omitted to prove missing actual zero-fill rule]
 *   - Payroll 2026-02 ($19,800.00 total):
 *       - Engineering Team Base Salaries $14,000.00 (1400000n)
 *       - Product & Design Salaries $4,500.00 (450000n)
 *       - External Contractor Invoices $1,300.00 (130000n)
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

    // Create 10 granular actual entries matching exact PDF totals
    await ActualModel.create(
      [
        // Marketing 2026-01 ($4,800.00 total)
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 200_000n,
          note: 'Google Search & Display Ads',
        },
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 100_000n,
          note: 'LinkedIn Sponsored Campaigns',
        },
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 120_000n,
          note: 'Creative Agency Retainer',
        },
        {
          userId,
          categoryId: marketing._id,
          monthKey: 202601,
          amountMinor: 60_000n,
          note: 'Brand Design Contractor',
        },

        // Payroll 2026-01 ($20,500.00 total)
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202601,
          amountMinor: 1_400_000n,
          note: 'Engineering Team Base Salaries',
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202601,
          amountMinor: 450_000n,
          note: 'Product & Design Salaries',
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202601,
          amountMinor: 200_000n,
          note: 'Healthcare & Dental Benefits',
        },

        // Payroll 2026-02 ($19,800.00 total)
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202602,
          amountMinor: 1_400_000n,
          note: 'Engineering Team Base Salaries',
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202602,
          amountMinor: 450_000n,
          note: 'Product & Design Salaries',
        },
        {
          userId,
          categoryId: payroll._id,
          monthKey: 202602,
          amountMinor: 130_000n,
          note: 'External Contractor Invoices',
        },
      ],
      { session, ordered: true },
    );

    return {
      plansCreated: 4,
      actualsCreated: 10,
      range: {
        from: '2026-01' as unknown as MonthString,
        to: '2026-02' as unknown as MonthString,
      },
    };
  });
}
