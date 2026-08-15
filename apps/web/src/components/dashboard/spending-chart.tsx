'use client';

import { type ReportMonthlySeriesItemDto } from '@crossval/contracts';
import { useMemo } from 'react';

import { cn } from '@/src/lib/cn';
import { formatCentsToDollars } from '@/src/lib/money-format';

import { WidgetBox } from '../ui/widget-box';

type SpendingChartProps = {
  monthlySeries: ReportMonthlySeriesItemDto[];
};

export function SpendingChart({ monthlySeries }: SpendingChartProps) {
  // Find maximum dollar value across plan and actual to scale chart bars
  const maxValMinor = useMemo(() => {
    let max = 100000n; // default min scale $1,000
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
    <WidgetBox className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-h6 font-semibold text-text-strong-950">
            Monthly Spending Comparison
          </h2>
          <p className="text-paragraph-xs text-text-sub-600">
            Planned budget versus actual expenses across financial periods
          </p>
        </div>

        <div className="flex items-center gap-4 text-label-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary-base" />
            <span className="text-text-sub-600">Planned Budget</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500" />
            <span className="text-text-sub-600">Actual (Under Target)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-rose-500" />
            <span className="text-text-sub-600">Actual (Over Target)</span>
          </div>
        </div>
      </div>

      {monthlySeries.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-12 bg-bg-weak-50 text-paragraph-sm text-text-sub-600">
          No spending activity recorded for this period.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 sm:gap-3 items-end h-56 pt-6 pb-2 border-b border-stroke-soft-200">
            {monthlySeries.map((item) => {
              const plan = Number(BigInt(item.planMinor));
              const actual = Number(BigInt(item.actualMinor));
              const variance = Number(BigInt(item.varianceMinor));

              const planHeightPercent = Math.min(100, Math.round((plan / maxValNumber) * 100));
              const actualHeightPercent = Math.min(100, Math.round((actual / maxValNumber) * 100));

              const isOver = variance > 0;

              return (
                <div
                  key={item.month}
                  className="group relative flex flex-col items-center justify-end h-full gap-1"
                >
                  {/* Bars */}
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    {/* Plan Bar */}
                    <div
                      style={{ height: `${Math.max(4, planHeightPercent)}%` }}
                      className="w-2 sm:w-3.5 rounded-t-sm bg-primary-base/80 transition-all duration-300 group-hover:bg-primary-base"
                    />

                    {/* Actual Bar */}
                    <div
                      style={{ height: `${Math.max(4, actualHeightPercent)}%` }}
                      className={cn(
                        'w-2 sm:w-3.5 rounded-t-sm transition-all duration-300',
                        isOver
                          ? 'bg-rose-500/80 group-hover:bg-rose-500'
                          : 'bg-emerald-500/80 group-hover:bg-emerald-500',
                      )}
                    />
                  </div>

                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full mb-2 hidden z-30 rounded-8 bg-text-strong-950 p-2.5 text-white shadow-regular-md group-hover:block w-40">
                    <p className="font-semibold text-label-xs mb-1">{item.month}</p>
                    <div className="space-y-0.5 text-paragraph-xs">
                      <div className="flex justify-between">
                        <span className="text-text-soft-400">Plan:</span>
                        <span className="tabular-nums font-medium">
                          {formatCentsToDollars(item.planMinor)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-soft-400">Actual:</span>
                        <span className="tabular-nums font-medium">
                          {formatCentsToDollars(item.actualMinor)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-text-sub-600/30 pt-0.5">
                        <span className="text-text-soft-400">Variance:</span>
                        <span
                          className={cn(
                            'tabular-nums font-medium',
                            isOver ? 'text-rose-400' : 'text-emerald-400',
                          )}
                        >
                          {formatCentsToDollars(item.varianceMinor)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month Labels */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3 text-center">
            {monthlySeries.map((item) => {
              const monthLabel = item.month.split('-')[1];
              return (
                <span key={item.month} className="text-label-xs text-text-sub-600 font-medium">
                  {monthLabel}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </WidgetBox>
  );
}
