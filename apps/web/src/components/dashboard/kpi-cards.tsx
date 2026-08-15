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
      <WidgetBox.Root className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-medium text-text-sub-600">Total Planned</span>
          <span className="grid size-9 place-items-center rounded-xl bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
            <RiCalendarCheckLine className="size-4" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-title-h4 font-medium tabular-nums text-text-strong">
            {formatCentsToDollars(planMinor)}
          </div>
          <p className="text-paragraph-xs text-text-soft-400">Budgeted target for period</p>
        </div>
      </WidgetBox.Root>

      {/* 2. Actual Spend */}
      <WidgetBox.Root className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-medium text-text-sub-600">Actual Spend</span>
          <span className="grid size-9 place-items-center rounded-xl bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
            <RiWallet3Line className="size-4" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-title-h4 font-medium tabular-nums text-text-strong">
            {formatCentsToDollars(actualMinor)}
          </div>
          <p className="text-paragraph-xs text-text-soft-400">Recorded expenses to date</p>
        </div>
      </WidgetBox.Root>

      {/* 3. Net Dollar Variance */}
      <WidgetBox.Root className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-medium text-text-sub-600">Net Variance ($)</span>
          <span className="grid size-9 place-items-center rounded-xl bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
            <RiScales3Line className="size-4" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-title-h4 font-medium tabular-nums text-text-strong">
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
      <WidgetBox.Root className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-medium text-text-sub-600">Variance Rate (%)</span>
          <span className="grid size-9 place-items-center rounded-xl bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
            <RiPercentLine className="size-4" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-title-h4 font-medium tabular-nums text-text-strong">
            {variancePercent !== null ? variancePercent : 'N/A'}
          </div>
          <p className="text-paragraph-xs text-text-soft-400">
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
