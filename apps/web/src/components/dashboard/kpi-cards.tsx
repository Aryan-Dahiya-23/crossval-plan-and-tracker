'use client';

import * as React from 'react';
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiCalendarCheckLine,
  RiPercentLine,
  RiScales3Line,
  RiWallet3Line,
} from '@remixicon/react';

import { formatCentsToDollars } from '../../lib/money-format';
import * as StatusBadge from '../ui/status-badge';
import * as WidgetBox from '../ui/widget-box';

type KPICardsProps = {
  planMinor: string;
  actualMinor: string;
  varianceMinor: string;
  variancePercent: string | null;
  overPlanCategoryCount: number;
};

export function KPICards({
  actualMinor,
  overPlanCategoryCount,
  planMinor,
  varianceMinor,
  variancePercent,
}: KPICardsProps) {
  const varianceBigInt = (() => {
    try {
      return BigInt(varianceMinor);
    } catch {
      return 0n;
    }
  })();

  const isOverBudget = varianceBigInt > 0n;
  const isZero = varianceBigInt === 0n;

  const varianceStatus = isZero ? 'neutral' : isOverBudget ? 'unfavorable' : 'favorable';

  const varianceBadgeText = isZero
    ? 'On Track'
    : isOverBudget
      ? `Over Target (+${variancePercent ?? '0%'})`
      : `Under Target (${variancePercent ?? '0%'})`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Planned Budget */}
      <WidgetBox.Root className="space-y-3 transition-shadow duration-200 hover:shadow-regular-sm">
        <div className="flex items-center justify-between">
          <span className="text-subheading-xs uppercase font-semibold tracking-wider text-text-sub-600">
            Total Planned
          </span>
          <span className="grid size-9 place-items-center rounded-xl bg-primary-lighter text-primary-base ring-1 ring-inset ring-primary-base/20">
            <RiCalendarCheckLine className="size-4.5" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-title-h4 font-semibold tabular-nums text-text-strong tracking-tight sm:text-title-h3">
            {formatCentsToDollars(planMinor)}
          </div>
          <p className="text-paragraph-xs text-text-sub-600">Budgeted target for period</p>
        </div>
      </WidgetBox.Root>

      {/* 2. Actual Spend */}
      <WidgetBox.Root className="space-y-3 transition-shadow duration-200 hover:shadow-regular-sm">
        <div className="flex items-center justify-between">
          <span className="text-subheading-xs uppercase font-semibold tracking-wider text-text-sub-600">
            Actual Spend
          </span>
          <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20">
            <RiWallet3Line className="size-4.5" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-title-h4 font-semibold tabular-nums text-text-strong tracking-tight sm:text-title-h3">
            {formatCentsToDollars(actualMinor)}
          </div>
          <p className="text-paragraph-xs text-text-sub-600">Recorded expenses to date</p>
        </div>
      </WidgetBox.Root>

      {/* 3. Net Dollar Variance */}
      <WidgetBox.Root className="space-y-3 transition-shadow duration-200 hover:shadow-regular-sm">
        <div className="flex items-center justify-between">
          <span className="text-subheading-xs uppercase font-semibold tracking-wider text-text-sub-600">
            Net Variance ($)
          </span>
          <span
            className={`grid size-9 place-items-center rounded-xl ring-1 ring-inset ${
              isOverBudget
                ? 'bg-rose-50 text-rose-600 ring-rose-500/20'
                : 'bg-emerald-50 text-emerald-600 ring-emerald-500/20'
            }`}
          >
            <RiScales3Line className="size-4.5" />
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="text-title-h4 font-semibold tabular-nums text-text-strong tracking-tight sm:text-title-h3">
            {varianceBigInt > 0n
              ? `+${formatCentsToDollars(varianceMinor)}`
              : formatCentsToDollars(varianceMinor)}
          </div>
          <div className="pt-0.5">
            <StatusBadge.Root status={varianceStatus}>
              {isZero ? (
                <StatusBadge.Dot />
              ) : (
                <StatusBadge.Icon as={isOverBudget ? RiArrowUpLine : RiArrowDownLine} />
              )}
              <span>{varianceBadgeText}</span>
            </StatusBadge.Root>
          </div>
        </div>
      </WidgetBox.Root>

      {/* 4. Variance Rate (%) */}
      <WidgetBox.Root className="space-y-3 transition-shadow duration-200 hover:shadow-regular-sm">
        <div className="flex items-center justify-between">
          <span className="text-subheading-xs uppercase font-semibold tracking-wider text-text-sub-600">
            Variance Rate (%)
          </span>
          <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-inset ring-purple-500/20">
            <RiPercentLine className="size-4.5" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-title-h4 font-semibold tabular-nums text-text-strong tracking-tight sm:text-title-h3">
            {variancePercent !== null ? variancePercent : 'N/A'}
          </div>
          <p className="text-paragraph-xs text-text-sub-600">
            {overPlanCategoryCount > 0
              ? `${overPlanCategoryCount} category over budget`
              : 'All categories on track'}
          </p>
        </div>
      </WidgetBox.Root>
    </div>
  );
}

export default KPICards;
