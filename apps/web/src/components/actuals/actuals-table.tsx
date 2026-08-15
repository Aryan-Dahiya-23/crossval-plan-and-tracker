'use client';

import * as React from 'react';
import { RiDeleteBinLine, RiEditLine, RiLockLine, RiReceiptLine } from '@remixicon/react';
import { useMemo, useState } from 'react';

import { useActuals } from '../../hooks/use-actuals';
import { useCategories } from '../../hooks/use-categories';
import { usePeriods } from '../../hooks/use-periods';
import { formatCentsToDollars } from '../../lib/money-format';
import { cn } from '../../utils/cn';
import { getCategoryColorStyle } from '../ui/color-picker';
import * as CompactButton from '../ui/compact-button';
import { Skeleton } from '../ui/skeleton';
import * as Table from '../ui/table';
import { ActualsFilters } from './actuals-filters';
import { CsvImportModal } from './csv-import-modal';
import { DeleteExpenseModal } from './delete-expense-modal';
import { EditableExpense, ExpenseDrawer } from './expense-drawer';

export function ActualsTable() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fromMonth, setFromMonth] = useState('2026-01');
  const [toMonth, setToMonth] = useState('2026-12');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EditableExpense | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<{
    id: string;
    amountMinor: string;
    month: string;
  } | null>(null);

  const { data: categories = [] } = useCategories({ includeArchived: true });
  const { data: actualsData, isLoading: isLoadingActuals } = useActuals({
    from: fromMonth,
    to: toMonth,
    categoryId: categoryId || undefined,
  });
  const { data: periods = [] } = usePeriods({
    from: fromMonth,
    to: toMonth,
  });

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const lockedMonths = useMemo(() => {
    const set = new Set<string>();
    for (const p of periods) {
      if (p.status === 'LOCKED') set.add(p.month);
    }
    return set;
  }, [periods]);

  // Filter client-side by search query
  const filteredActuals = useMemo(() => {
    const list = actualsData?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter((item) => (item.note ?? '').toLowerCase().includes(q));
  }, [actualsData?.data, search]);

  const totalExpenseMinor = useMemo(() => {
    let sum = 0n;
    for (const item of filteredActuals) {
      try {
        sum += BigInt(item.amountMinor);
      } catch {
        // Ignore
      }
    }
    return sum;
  }, [filteredActuals]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setDrawerOpen(true);
  };

  const handleOpenImport = () => {
    setImportModalOpen(true);
  };

  const handleOpenEdit = (expense: EditableExpense) => {
    setEditingExpense(expense);
    setDrawerOpen(true);
  };

  const handleOpenDelete = (item: { id: string; amountMinor: string; month: string }) => {
    setDeletingExpense(item);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <ActualsFilters
        search={search}
        onSearchChange={setSearch}
        categoryId={categoryId}
        onCategoryIdChange={setCategoryId}
        fromMonth={fromMonth}
        onFromMonthChange={setFromMonth}
        toMonth={toMonth}
        onToMonthChange={setToMonth}
        onAddExpense={handleOpenAdd}
        onOpenImportModal={handleOpenImport}
      />

      <div className="overflow-hidden rounded-2xl bg-bg-white shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-32">Month</Table.Head>
              <Table.Head className="w-48">Category</Table.Head>
              <Table.Head>Note / Description</Table.Head>
              <Table.Head className="text-right w-36">Amount</Table.Head>
              <Table.Head className="text-right w-24">Actions</Table.Head>
            </Table.Row>
          </Table.Header>

          <Table.Body spacing={0}>
            {isLoadingActuals ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Table.Row key={i}>
                  <Table.Cell>
                    <Skeleton className="h-4 w-20" />
                  </Table.Cell>
                  <Table.Cell>
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </Table.Cell>
                  <Table.Cell>
                    <Skeleton className="h-4 w-48" />
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <Skeleton className="ml-auto size-7 rounded-md" />
                  </Table.Cell>
                </Table.Row>
              ))
            ) : filteredActuals.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="h-48 text-center text-text-sub-600">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="grid size-10 place-items-center rounded-full bg-bg-weak-50 text-text-soft-400">
                      <RiReceiptLine className="size-5" />
                    </span>
                    <p className="font-medium text-text-strong">No expenses found</p>
                    <p className="text-paragraph-xs text-text-sub-600">
                      {search || categoryId
                        ? 'Try clearing or modifying your filter criteria.'
                        : 'Click "Add Expense" or "Import CSV" above to record transactions.'}
                    </p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredActuals.map((item) => {
                const category = categoryMap.get(item.categoryId);
                const colorStyle = getCategoryColorStyle(category?.colorKey);
                const isLocked = lockedMonths.has(item.month);

                return (
                  <Table.Row key={item.id} className="border-b border-stroke-soft-200/60">
                    {/* Month */}
                    <Table.Cell className="font-medium text-text-strong">
                      <div className="flex items-center gap-1.5">
                        <span>{item.month}</span>
                        {isLocked && (
                          <span title="Period is locked">
                            <RiLockLine className="size-3.5 text-warning-base" />
                          </span>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Category Pill */}
                    <Table.Cell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-xs ring-1 ring-inset font-medium',
                          colorStyle.badge,
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', colorStyle.bg)} />
                        <span className="truncate">{category?.name ?? 'Unknown'}</span>
                      </span>
                    </Table.Cell>

                    {/* Note */}
                    <Table.Cell className="text-text-sub-600">
                      {item.note ? (
                        <span>{item.note}</span>
                      ) : (
                        <span className="text-text-soft-400 italic">No description</span>
                      )}
                    </Table.Cell>

                    {/* Amount */}
                    <Table.Cell className="text-right font-semibold tabular-nums text-text-strong">
                      {formatCentsToDollars(item.amountMinor)}
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CompactButton.Root
                          size="large"
                          variant="ghost"
                          disabled={isLocked}
                          onClick={() =>
                            handleOpenEdit({
                              id: item.id,
                              categoryId: item.categoryId,
                              month: item.month,
                              amountMinor: item.amountMinor,
                              note: item.note,
                            })
                          }
                          aria-label={`Edit expense ${item.id}`}
                        >
                          <CompactButton.Icon
                            as={RiEditLine}
                            className="text-text-sub-600 hover:text-text-strong"
                          />
                        </CompactButton.Root>

                        <CompactButton.Root
                          size="large"
                          variant="ghost"
                          disabled={isLocked}
                          onClick={() =>
                            handleOpenDelete({
                              id: item.id,
                              amountMinor: item.amountMinor,
                              month: item.month,
                            })
                          }
                          aria-label={`Delete expense ${item.id}`}
                        >
                          <CompactButton.Icon
                            as={RiDeleteBinLine}
                            className="text-text-sub-600 hover:text-error-base"
                          />
                        </CompactButton.Root>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>

        {filteredActuals.length > 0 && (
          <div className="flex items-center justify-between border-t border-stroke-soft-200 bg-bg-weak-50/50 px-5 py-3">
            <span className="text-paragraph-xs text-text-sub-600">
              Showing{' '}
              <strong className="font-semibold text-text-strong">{filteredActuals.length}</strong>{' '}
              transactions
            </span>
            <div className="flex items-center gap-2 text-paragraph-sm">
              <span className="text-text-sub-600">Total:</span>
              <span className="font-bold tabular-nums text-text-strong">
                {formatCentsToDollars(totalExpenseMinor.toString())}
              </span>
            </div>
          </div>
        )}
      </div>

      <ExpenseDrawer open={drawerOpen} onOpenChange={setDrawerOpen} expense={editingExpense} />

      <CsvImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />

      <DeleteExpenseModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        expense={deletingExpense}
      />
    </div>
  );
}
export default ActualsTable;
