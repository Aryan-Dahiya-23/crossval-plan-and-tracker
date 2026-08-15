'use client';

import * as React from 'react';
import { RiFileList3Line } from '@remixicon/react';

import { useActuals } from '../../hooks/use-actuals';
import { formatCentsToDollars } from '../../lib/money-format';
import { getCategoryColorStyle } from '../ui/color-picker';
import * as Drawer from '../ui/drawer';
import { TableLoadingState } from '../ui/loading-state';
import * as Table from '../ui/table';

export type DrilldownTarget = {
  categoryId: string;
  categoryName: string;
  colorKey?: string | null;
  month: string;
  planMinor: string;
  actualMinor: string;
  varianceMinor: string;
  variancePercent: string | null;
};

type DrilldownDrawerProps = {
  target: DrilldownTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DrilldownDrawer({ onOpenChange, open, target }: DrilldownDrawerProps) {
  if (!target) return null;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-[480px]">
        <Drawer.Header>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-primary-lighter text-primary-base">
              <RiFileList3Line className="size-5" aria-hidden="true" />
            </span>
            <div>
              <Drawer.Title>Expense Drill-Down</Drawer.Title>
              <Drawer.Description>
                Individual transactions recorded for {target.categoryName} ({target.month})
              </Drawer.Description>
            </div>
          </div>
        </Drawer.Header>

        {open && <DrilldownContent target={target} />}
      </Drawer.Content>
    </Drawer.Root>
  );
}

function DrilldownContent({ target }: { target: DrilldownTarget }) {
  const { data: actualsData, isLoading } = useActuals({
    from: target.month,
    to: target.month,
    categoryId: target.categoryId,
  });

  const transactions = actualsData?.data ?? [];
  const colorStyle = getCategoryColorStyle(target.colorKey);

  return (
    <Drawer.Body className="flex flex-1 flex-col gap-5">
      {/* Target Summary Card */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-bg-weak-50 p-4 ring-1 ring-inset ring-stroke-soft-200 text-center">
        <div>
          <span className="text-paragraph-xs text-text-sub-600">Planned</span>
          <p className="font-semibold tabular-nums text-text-strong">
            {formatCentsToDollars(target.planMinor)}
          </p>
        </div>
        <div>
          <span className="text-paragraph-xs text-text-sub-600">Actual</span>
          <p className="font-semibold tabular-nums text-text-strong">
            {formatCentsToDollars(target.actualMinor)}
          </p>
        </div>
        <div>
          <span className="text-paragraph-xs text-text-sub-600">Variance</span>
          <p
            className={`font-semibold tabular-nums ${
              BigInt(target.varianceMinor) > 0n ? 'text-error-base' : 'text-success-base'
            }`}
          >
            {formatCentsToDollars(target.varianceMinor)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-label-sm font-semibold text-text-strong">
            Recorded Transactions ({transactions.length})
          </h4>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-xs ring-1 ring-inset font-medium ${colorStyle.badge}`}
          >
            <span className={`size-1.5 rounded-full ${colorStyle.bg}`} />
            <span>{target.categoryName}</span>
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl ring-1 ring-inset ring-stroke-soft-200 bg-bg-white">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head className="w-24">Month</Table.Head>
                <Table.Head>Note</Table.Head>
                <Table.Head className="text-right w-28">Amount</Table.Head>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {isLoading ? (
                <TableLoadingState message="Loading transactions..." colSpan={3} />
              ) : transactions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3} className="h-28 text-center text-text-sub-600">
                    No individual expense entries recorded.
                  </Table.Cell>
                </Table.Row>
              ) : (
                transactions.map((tx) => (
                  <Table.Row key={tx.id} className="border-b border-stroke-soft-200/60">
                    <Table.Cell className="font-medium text-text-strong text-paragraph-xs">
                      {tx.month}
                    </Table.Cell>
                    <Table.Cell className="text-text-sub-600 text-paragraph-xs">
                      {tx.note || <span className="italic text-text-soft-400">No note</span>}
                    </Table.Cell>
                    <Table.Cell className="text-right font-semibold tabular-nums text-text-strong">
                      {formatCentsToDollars(tx.amountMinor)}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    </Drawer.Body>
  );
}
export default DrilldownDrawer;
