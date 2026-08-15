'use client';

import * as React from 'react';
import { type ReportMonthlySeriesItemDto } from '@crossval/contracts';
import { useMemo } from 'react';

import { cn } from '../../utils/cn';
import { formatCentsToDollars } from '../../lib/money-format';
import * as WidgetBox from '../ui/widget-box';

type SpendingChartProps = {
  monthlySeries: ReportMonthlySeriesItemDto[];
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function SpendingChart({ monthlySeries }: SpendingChartProps) {
  // Find maximum dollar value across plan and actual to scale chart bars
  const maxValMinor = useMemo(() => {
    let max = 100_000n; // default min scale $1,000
    for (const item of monthlySeries) {
      try {
        const plan = BigInt(item.planMinor);
        const actual = BigInt(item.actualMinor);
        if (plan > max) max = plan;
        if (actual > max) max = actual;
      } catch {
        // Ignore
      }
    }
    return max;
  }, [monthlySeries]);

  const maxValNumber = Number(maxValMinor);

  return (
    <WidgetBox.Root className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-h6 font-semibold text-text-strong">
            Monthly Spending Comparison
          </h2>
          <p className="text-paragraph-xs text-text-sub-600">
            Planned budget targets versus actual recorded expenses across financial periods
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-label-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary-base" />
            <span className="text-text-sub-600 font-medium">Planned Budget</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500" />
            <span className="text-text-sub-600 font-medium">Actual (Under Target)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-rose-500" />
            <span className="text-text-sub-600 font-medium">Actual (Over Target)</span>
          </div>
        </div>
      </div>

      {monthlySeries.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-bg-weak-50 text-paragraph-sm text-text-sub-600 border border-dashed border-stroke-soft-200">
          No spending activity recorded for this period.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 sm:gap-4 items-end h-60 pt-6 pb-2 border-b border-stroke-soft-200">
            {monthlySeries.map((item) => {
              const plan = Number(BigInt(item.planMinor));
              const actual = Number(BigInt(item.actualMinor));
              const variance = Number(BigInt(item.varianceMinor));

              const planHeightPercent = Math.min(100, Math.round((plan / maxValNumber) * 100));
              const actualHeightPercent = Math.min(100, Math.round((actual / maxValNumber) * 100));

              const isOver = variance > 0;
              const monthIndex = parseInt(item.month.split('-')[1] ?? '1', 10) - 1;
              const monthLabel = MONTH_NAMES[monthIndex] ?? item.month;

              return (
                <div
                  key={item.month}
                  className="group relative flex flex-col items-center justify-end h-full gap-1"
                >
                  {/* Bars */}
                  <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full">
                    {/* Plan Bar */}
                    <div
                      style={{ height: `${Math.max(4, planHeightPercent)}%` }}
                      className="w-2.5 sm:w-4 rounded-t-md bg-primary-base/80 transition-all duration-300 group-hover:bg-primary-base group-hover:shadow-sm"
                    />

                    {/* Actual Bar */}
                    <div
                      style={{ height: `${Math.max(4, actualHeightPercent)}%` }}
                      className={cn(
                        'w-2.5 sm:w-4 rounded-t-md transition-all duration-300',
                        isOver
                          ? 'bg-rose-500/80 group-hover:bg-rose-500 group-hover:shadow-sm'
                          : 'bg-emerald-500/80 group-hover:bg-emerald-500 group-hover:shadow-sm',
                      )}
                    />
                  </div>

                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full mb-3 hidden z-30 rounded-xl bg-bg-surface-800 p-3 text-text-white shadow-regular-md group-hover:block w-44 backdrop-blur-md">
                    <p className="font-semibold text-label-xs mb-1.5 text-text-white flex items-center justify-between">
                      <span>{monthLabel}</span>
                      <span className="text-paragraph-2xs text-text-soft-400 font-mono">
                        {item.month}
                      </span>
                    </p>
                    <div className="space-y-1 text-paragraph-xs">
                      <div className="flex justify-between">
                        <span className="text-text-soft-400">Plan:</span>
                        <span className="tabular-nums font-medium text-text-white">
                          {formatCentsToDollars(item.planMinor)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-soft-400">Actual:</span>
                        <span className="tabular-nums font-medium text-text-white">
                          {formatCentsToDollars(item.actualMinor)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-stroke-sub-300/30 pt-1">
                        <span className="text-text-soft-400">Variance:</span>
                        <span
                          className={cn(
                            'tabular-nums font-semibold',
                            isOver ? 'text-rose-400' : 'text-emerald-400',
                          )}
                        >
                          {variance > 0
                            ? `+${formatCentsToDollars(item.varianceMinor)}`
                            : formatCentsToDollars(item.varianceMinor)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month Labels */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 text-center">
            {monthlySeries.map((item) => {
              const monthIndex = parseInt(item.month.split('-')[1] ?? '1', 10) - 1;
              const monthLabel = MONTH_NAMES[monthIndex] ?? item.month;
              return (
                <span key={item.month} className="text-label-xs text-text-sub-600 font-medium">
                  {monthLabel}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </WidgetBox.Root>
  );
}

export default SpendingChart;
