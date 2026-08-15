'use client';

import * as React from 'react';
import { type ReportDto } from '@crossval/contracts';
import { RiArrowRightSLine, RiInformationLine, RiLockLine } from '@remixicon/react';
import { useState } from 'react';

import { formatCentsToDollars } from '../../lib/money-format';
import { cn } from '../../utils/cn';
import { getCategoryColorStyle } from '../ui/color-picker';
import * as StatusBadge from '../ui/status-badge';
import * as Table from '../ui/table';
import { DrilldownDrawer, type DrilldownTarget } from './drilldown-drawer';

type ReportTableProps = {
  report: ReportDto;
};

export function ReportTable({ report }: ReportTableProps) {
  const [drilldownTarget, setDrilldownTarget] = useState<DrilldownTarget | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenDrilldown = (target: DrilldownTarget) => {
    setDrilldownTarget(target);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-bg-white shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-56">Category / Month</Table.Head>
              <Table.Head className="text-right w-36">Planned Target</Table.Head>
              <Table.Head className="text-right w-36">Actual Spend</Table.Head>
              <Table.Head className="text-right w-36">Variance ($)</Table.Head>
              <Table.Head className="text-right w-32">Variance (%)</Table.Head>
              <Table.Head className="text-center w-28">Entries</Table.Head>
            </Table.Row>
          </Table.Header>

          <Table.Body spacing={0}>
            {report.categories.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="h-48 text-center text-text-sub-600">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="grid size-10 place-items-center rounded-full bg-bg-weak-50 text-text-soft-400">
                      <RiInformationLine className="size-5" />
                    </span>
                    <p className="font-medium text-text-strong">No report data found</p>
                    <p className="text-paragraph-xs text-text-sub-600">
                      Set planning targets or record actual expenses to view comparisons.
                    </p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              report.categories.map((catGroup) => {
                const colorStyle = getCategoryColorStyle(catGroup.category.colorKey);
                const subtotalVarianceBigInt = BigInt(catGroup.subtotal.varianceMinor);
                const isSubtotalOver = subtotalVarianceBigInt > 0n;

                return (
                  <React.Fragment key={catGroup.category.id}>
                    {/* Category Header Row */}
                    <Table.Row className="bg-bg-weak-50/80 border-b border-stroke-soft-200 font-medium">
                      <Table.Cell colSpan={6} className="h-10 py-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-xs ring-1 ring-inset font-medium',
                              colorStyle.badge,
                            )}
                          >
                            <span className={cn('size-1.5 rounded-full', colorStyle.bg)} />
                            <span className="truncate">{catGroup.category.name}</span>
                          </span>

                          <span className="text-paragraph-xs text-text-sub-600">
                            Subtotal Plan: {formatCentsToDollars(catGroup.subtotal.planMinor)} |
                            Actual: {formatCentsToDollars(catGroup.subtotal.actualMinor)}
                          </span>
                        </div>
                      </Table.Cell>
                    </Table.Row>

                    {/* Monthly Breakdown Rows */}
                    {catGroup.months.map((m) => {
                      const varianceBigInt = BigInt(m.varianceMinor);
                      const isOver = varianceBigInt > 0n;
                      const isZero = varianceBigInt === 0n;

                      return (
                        <Table.Row
                          key={m.month}
                          className="cursor-pointer hover:bg-bg-weak-50/60"
                          onClick={() =>
                            handleOpenDrilldown({
                              categoryId: catGroup.category.id,
                              categoryName: catGroup.category.name,
                              colorKey: catGroup.category.colorKey,
                              month: m.month,
                              planMinor: m.planMinor,
                              actualMinor: m.actualMinor,
                              varianceMinor: m.varianceMinor,
                              variancePercent: m.variancePercent,
                            })
                          }
                        >
                          {/* Month */}
                          <Table.Cell className="pl-6 font-medium text-text-strong">
                            <div className="flex items-center gap-2">
                              <span>{m.month}</span>
                              {m.locked && (
                                <span title="Period is locked">
                                  <RiLockLine className="size-3.5 text-warning-base" />
                                </span>
                              )}
                            </div>
                          </Table.Cell>

                          {/* Planned Target */}
                          <Table.Cell className="text-right tabular-nums text-text-sub-600">
                            {formatCentsToDollars(m.planMinor, { fallback: '$0.00' })}
                          </Table.Cell>

                          {/* Actual Spend */}
                          <Table.Cell className="text-right font-medium tabular-nums text-text-strong">
                            {formatCentsToDollars(m.actualMinor, { fallback: '$0.00' })}
                          </Table.Cell>

                          {/* Variance ($) */}
                          <Table.Cell
                            className={cn(
                              'text-right font-semibold tabular-nums',
                              isZero
                                ? 'text-text-sub-600'
                                : isOver
                                  ? 'text-error-base'
                                  : 'text-success-base',
                            )}
                          >
                            {varianceBigInt > 0n
                              ? `+${formatCentsToDollars(m.varianceMinor)}`
                              : formatCentsToDollars(m.varianceMinor)}
                          </Table.Cell>

                          {/* Variance (%) */}
                          <Table.Cell className="text-right tabular-nums">
                            {m.variancePercent !== null ? (
                              <StatusBadge.Root
                                status={isZero ? 'neutral' : isOver ? 'unfavorable' : 'favorable'}
                              >
                                <StatusBadge.Dot />
                                <span>{isOver ? `+${m.variancePercent}` : m.variancePercent}</span>
                              </StatusBadge.Root>
                            ) : (
                              <span className="text-text-soft-400 font-medium text-paragraph-xs">
                                N/A
                              </span>
                            )}
                          </Table.Cell>

                          {/* Entries Count with Drilldown link */}
                          <Table.Cell className="text-center">
                            <span className="inline-flex items-center gap-1 rounded-md bg-bg-weak-50 px-2 py-0.5 text-label-xs font-medium text-text-sub-600 group-hover/row:bg-bg-soft-200">
                              <span>{m.actualEntryCount}</span>
                              <RiArrowRightSLine className="size-3" />
                            </span>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}

                    {/* Category Subtotal Row */}
                    <Table.Row className="bg-bg-weak-50/40 border-t border-stroke-soft-200 font-semibold text-text-strong text-paragraph-sm">
                      <Table.Cell className="pl-6 text-text-sub-600 italic">
                        {catGroup.category.name} Subtotal
                      </Table.Cell>
                      <Table.Cell className="text-right tabular-nums">
                        {formatCentsToDollars(catGroup.subtotal.planMinor)}
                      </Table.Cell>
                      <Table.Cell className="text-right tabular-nums">
                        {formatCentsToDollars(catGroup.subtotal.actualMinor)}
                      </Table.Cell>
                      <Table.Cell
                        className={cn(
                          'text-right tabular-nums font-bold',
                          isSubtotalOver ? 'text-error-base' : 'text-success-base',
                        )}
                      >
                        {formatCentsToDollars(catGroup.subtotal.varianceMinor)}
                      </Table.Cell>
                      <Table.Cell className="text-right tabular-nums">
                        {catGroup.subtotal.variancePercent !== null ? (
                          <span
                            className={isSubtotalOver ? 'text-error-base' : 'text-success-base'}
                          >
                            {catGroup.subtotal.variancePercent}
                          </span>
                        ) : (
                          <span className="text-text-soft-400 font-medium">N/A</span>
                        )}
                      </Table.Cell>
                      <Table.Cell />
                    </Table.Row>
                  </React.Fragment>
                );
              })
            )}
          </Table.Body>
        </Table.Root>

        {/* Grand Total Footer */}
        {report.categories.length > 0 && (
          <div className="flex items-center justify-between border-t-2 border-stroke-soft-200 bg-bg-weak-50 px-6 py-4 font-bold text-text-strong">
            <span className="text-label-md font-bold">GRAND TOTAL</span>
            <div className="flex items-center gap-8 text-label-md">
              <div>
                <span className="text-paragraph-xs text-text-sub-600 block">Plan</span>
                <span className="tabular-nums font-semibold">
                  {formatCentsToDollars(report.summary.planMinor)}
                </span>
              </div>
              <div>
                <span className="text-paragraph-xs text-text-sub-600 block">Actual</span>
                <span className="tabular-nums font-semibold">
                  {formatCentsToDollars(report.summary.actualMinor)}
                </span>
              </div>
              <div>
                <span className="text-paragraph-xs text-text-sub-600 block">Variance</span>
                <span
                  className={cn(
                    'tabular-nums font-bold',
                    BigInt(report.summary.varianceMinor) > 0n
                      ? 'text-error-base'
                      : 'text-success-base',
                  )}
                >
                  {formatCentsToDollars(report.summary.varianceMinor)}
                </span>
              </div>
              <div>
                <span className="text-paragraph-xs text-text-sub-600 block">Rate</span>
                <span className="tabular-nums font-bold">
                  {report.summary.variancePercent !== null ? report.summary.variancePercent : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <DrilldownDrawer open={drawerOpen} onOpenChange={setDrawerOpen} target={drilldownTarget} />
    </div>
  );
}
export default ReportTable;
