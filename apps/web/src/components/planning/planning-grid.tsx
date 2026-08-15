'use client';

import * as React from 'react';
import { RiLockLine } from '@remixicon/react';
import { useCallback, useMemo, useState } from 'react';

import { useCategories } from '../../hooks/use-categories';
import { usePeriods } from '../../hooks/use-periods';
import { useBatchUpsertPlans, usePlans } from '../../hooks/use-plans';
import { formatCentsToDollars, parseDollarsToCents } from '../../lib/money-format';
import { cn } from '../../utils/cn';
import { getCategoryColorStyle } from '../ui/color-picker';
import { PageLoadingState } from '../ui/loading-state';
import * as Table from '../ui/table';
import { useToast } from '../ui/toast';
import { PlanningHeader } from './planning-header';

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

export function PlanningGrid() {
  const [year, setYear] = useState<number>(2026);
  const [draftState, setDraftState] = useState<Record<string, string | null>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

  const toast = useToast();

  const fromMonth = `${year}-01`;
  const toMonth = `${year}-12`;

  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: serverPlans = [], isLoading: isLoadingPlans } = usePlans({
    from: fromMonth,
    to: toMonth,
  });
  const { data: periods = [] } = usePeriods({
    from: fromMonth,
    to: toMonth,
  });

  const batchUpsertMutation = useBatchUpsertPlans();

  // Map server plans: key `${categoryId}:${month}` -> amountMinor
  const serverPlanMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const plan of serverPlans) {
      map.set(`${plan.categoryId}:${plan.month}`, plan.amountMinor);
    }
    return map;
  }, [serverPlans]);

  // Set of locked months
  const lockedMonths = useMemo(() => {
    const set = new Set<string>();
    for (const period of periods) {
      if (period.status === 'LOCKED') {
        set.add(period.month);
      }
    }
    return set;
  }, [periods]);

  // Active (non-archived) categories
  const activeCategories = useMemo(
    () => categories.filter((c) => c.archivedAt === null),
    [categories],
  );

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = (i + 1).toString().padStart(2, '0');
      return {
        key: `${year}-${monthNum}`,
        label: MONTH_NAMES[i]!,
        monthNum,
      };
    });
  }, [year]);

  // Get cell value (draft overrides server)
  const getCellValue = useCallback(
    (categoryId: string, month: string): string | null => {
      const key = `${categoryId}:${month}`;
      if (key in draftState) {
        return draftState[key] ?? null;
      }
      return serverPlanMap.get(key) ?? null;
    },
    [draftState, serverPlanMap],
  );

  const handleCellChange = (categoryId: string, month: string, rawInput: string) => {
    const key = `${categoryId}:${month}`;
    const parsedMinor = parseDollarsToCents(rawInput);
    const initialMinor = serverPlanMap.get(key) ?? null;

    setDraftState((prev) => ({
      ...prev,
      [key]: parsedMinor,
    }));

    setDirtyKeys((prev) => {
      const next = new Set(prev);
      if (parsedMinor === initialMinor) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleReset = () => {
    setDraftState({});
    setDirtyKeys(new Set());
  };

  const handleSave = async () => {
    if (dirtyKeys.size === 0) return;

    // Group changes by month
    const changesByMonth = new Map<string, { categoryId: string; amountMinor: string | null }[]>();

    for (const key of dirtyKeys) {
      const [categoryId, month] = key.split(':');
      if (!categoryId || !month) continue;

      const amountMinor =
        key in draftState ? (draftState[key] ?? null) : (serverPlanMap.get(key) ?? null);

      const existing = changesByMonth.get(month) ?? [];
      existing.push({ categoryId, amountMinor });
      changesByMonth.set(month, existing);
    }

    try {
      for (const [month, changes] of changesByMonth.entries()) {
        await batchUpsertMutation.mutateAsync({ month, changes });
      }
      setDraftState({});
      setDirtyKeys(new Set());
      toast.success('Planning targets successfully saved.');
    } catch {
      toast.error('Failed to save planning targets. Please check locked periods.');
    }
  };

  // Row Subtotal calculation (BigInt)
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, bigint>();
    for (const category of activeCategories) {
      let sum = 0n;
      for (const { key: month } of months) {
        const val = getCellValue(category.id, month);
        if (val !== null) {
          try {
            sum += BigInt(val);
          } catch {
            // Ignore invalid BigInt
          }
        }
      }
      totals.set(category.id, sum);
    }
    return totals;
  }, [activeCategories, months, getCellValue]);

  // Column Monthly Total calculation (BigInt)
  const monthlyTotals = useMemo(() => {
    const totals = new Map<string, bigint>();
    for (const { key: month } of months) {
      let sum = 0n;
      for (const category of activeCategories) {
        const val = getCellValue(category.id, month);
        if (val !== null) {
          try {
            sum += BigInt(val);
          } catch {
            // Ignore invalid BigInt
          }
        }
      }
      totals.set(month, sum);
    }
    return totals;
  }, [activeCategories, months, getCellValue]);

  // Grand Total calculation (BigInt)
  const grandTotal = useMemo(() => {
    let sum = 0n;
    for (const total of monthlyTotals.values()) {
      sum += total;
    }
    return sum;
  }, [monthlyTotals]);

  const isLoading = isLoadingCategories || isLoadingPlans;

  if (isLoading) {
    return (
      <div className="p-6">
        <PageLoadingState
          message="Loading Planning Matrix"
          subMessage="Preparing 12-month budget targets and categories..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlanningHeader
        year={year}
        onYearChange={(newYear) => {
          setYear(newYear);
          handleReset();
        }}
        dirtyCount={dirtyKeys.size}
        onSave={handleSave}
        onReset={handleReset}
        isSaving={batchUpsertMutation.isPending}
      />

      <div className="overflow-hidden rounded-2xl bg-bg-white shadow-regular-xs border border-stroke-soft-200">
        <Table.Root className="min-w-[960px]">
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-44 sticky left-0 z-20 bg-bg-weak-50">Category</Table.Head>
              {months.map(({ key: month, label }) => {
                const isLocked = lockedMonths.has(month);
                return (
                  <Table.Head key={month} className="text-right w-20 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <span>{label}</span>
                      {isLocked && (
                        <span title="Period locked">
                          <RiLockLine className="size-3 text-warning-base" />
                        </span>
                      )}
                    </div>
                  </Table.Head>
                );
              })}
              <Table.Head className="text-right w-28 bg-bg-weak-50/90 font-semibold px-3">
                Annual Target
              </Table.Head>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {activeCategories.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={14} className="h-32 text-center text-text-sub-600">
                  No active categories. Create categories to begin setting planning targets.
                </Table.Cell>
              </Table.Row>
            ) : (
              activeCategories.map((category) => {
                const colorStyle = getCategoryColorStyle(category.colorKey);
                const rowTotal = categoryTotals.get(category.id) ?? 0n;

                return (
                  <Table.Row key={category.id} className="border-b border-stroke-soft-200">
                    {/* Category Column */}
                    <Table.Cell className="sticky left-0 z-10 bg-bg-white font-medium">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-xs ring-1 ring-inset font-medium',
                          colorStyle.badge,
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', colorStyle.bg)} />
                        <span className="truncate">{category.name}</span>
                      </span>
                    </Table.Cell>

                    {/* Month Cells */}
                    {months.map(({ key: month }) => {
                      const isLocked = lockedMonths.has(month);
                      const rawVal = getCellValue(category.id, month);
                      const key = `${category.id}:${month}`;
                      const isDirty = dirtyKeys.has(key);

                      return (
                        <Table.Cell
                          key={month}
                          className={cn(
                            'p-1 text-right transition-colors h-11',
                            isLocked && 'bg-bg-weak-50/40 text-text-disabled-300',
                            isDirty && 'bg-primary-lighter/30',
                          )}
                        >
                          <PlanCellInput
                            disabled={isLocked || batchUpsertMutation.isPending}
                            value={rawVal}
                            onChange={(val) => handleCellChange(category.id, month, val)}
                            isLocked={isLocked}
                          />
                        </Table.Cell>
                      );
                    })}

                    {/* Row Total */}
                    <Table.Cell className="text-right font-semibold tabular-nums text-text-strong bg-bg-weak-50/30">
                      {formatCentsToDollars(rowTotal.toString())}
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}

            {activeCategories.length > 0 && (
              <Table.Row className="border-t-2 border-stroke-soft-200 bg-bg-weak-50/80 font-semibold text-text-strong">
                <Table.Cell className="sticky left-0 z-10 bg-bg-weak-50 font-semibold text-text-strong">
                  <span className="text-label-xs font-semibold text-text-strong uppercase tracking-wider">
                    Total Budget
                  </span>
                </Table.Cell>
                {months.map(({ key: month }) => {
                  const monthSum = monthlyTotals.get(month) ?? 0n;
                  return (
                    <Table.Cell
                      key={month}
                      className="text-right px-2 py-3 font-semibold tabular-nums text-text-strong"
                    >
                      {formatCentsToDollars(monthSum.toString())}
                    </Table.Cell>
                  );
                })}
                <Table.Cell className="text-right px-2 py-3 font-bold tabular-nums text-primary-base bg-primary-lighter/40">
                  {formatCentsToDollars(grandTotal.toString())}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  );
}

function PlanCellInput({
  disabled,
  isLocked,
  onChange,
  value,
}: {
  value: string | null;
  onChange: (val: string) => void;
  disabled?: boolean;
  isLocked?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState('');

  const displayFormatted = useMemo(() => {
    if (value === null) return '';
    return formatCentsToDollars(value, { fallback: '', showDecimals: false });
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    if (value === null) {
      setText('');
    } else {
      const dollars = (BigInt(value) / 100n).toString();
      setText(dollars);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    onChange(text);
  };

  if (isLocked) {
    return (
      <span className="block px-2 py-1 text-paragraph-xs text-text-sub-600 select-none">
        {displayFormatted || '—'}
      </span>
    );
  }

  return (
    <input
      type="text"
      disabled={disabled}
      value={isFocused ? text : displayFormatted}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => setText(e.target.value)}
      placeholder="—"
      className={cn(
        'w-full rounded-md px-2 py-1 text-right text-paragraph-sm font-medium tabular-nums outline-none',
        'bg-transparent transition duration-150',
        'hover:bg-bg-weak-50 focus:bg-bg-white focus:shadow-button-important-focus focus:ring-1 focus:ring-stroke-strong-950',
        'placeholder:text-text-soft-400 disabled:pointer-events-none disabled:text-text-disabled-300',
      )}
    />
  );
}
export default PlanningGrid;
