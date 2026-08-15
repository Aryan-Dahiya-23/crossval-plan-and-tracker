'use client';

import * as React from 'react';
import { type PositiveMoneyMinorString } from '@crossval/contracts';
import { RiErrorWarningLine, RiMoneyDollarCircleLine } from '@remixicon/react';
import { useState, type FormEvent } from 'react';

import { useCreateActual, useUpdateActual } from '../../hooks/use-actuals';
import { useCategories } from '../../hooks/use-categories';
import { ApiClientError } from '../../lib/api-client';
import { formatCentsForInput, parseDollarsToCents } from '../../lib/money-format';
import * as Button from '../ui/button';
import * as Drawer from '../ui/drawer';
import * as Input from '../ui/input';
import * as Select from '../ui/select';
import { useToast } from '../ui/toast';

export type EditableExpense = {
  id: string;
  categoryId: string;
  month: string;
  amountMinor: string;
  note: string | null;
};

type ExpenseDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: EditableExpense | null;
};

const MONTH_OPTIONS = [
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
  '2026-11',
  '2026-12',
];

export function ExpenseDrawer({ expense, onOpenChange, open }: ExpenseDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-primary-lighter text-primary-base">
              <RiMoneyDollarCircleLine className="size-5" aria-hidden="true" />
            </span>
            <div>
              <Drawer.Title>
                {expense ? 'Edit Expense Entry' : 'Record Actual Expense'}
              </Drawer.Title>
              <Drawer.Description>
                {expense
                  ? 'Update transaction details'
                  : 'Add a new expense transaction to your financial ledger'}
              </Drawer.Description>
            </div>
          </div>
        </Drawer.Header>

        {open && (
          <ExpenseFormContent
            key={expense?.id ?? 'create-new'}
            expense={expense}
            onClose={() => onOpenChange(false)}
          />
        )}
      </Drawer.Content>
    </Drawer.Root>
  );
}

function ExpenseFormContent({
  expense,
  onClose,
}: {
  expense?: EditableExpense | null | undefined;
  onClose: () => void;
}) {
  const isEditing = Boolean(expense);

  const { data: categories = [] } = useCategories();
  const activeCategories = categories.filter((c) => c.archivedAt === null);

  const [month, setMonth] = useState<string>(expense?.month ?? '2026-01');
  const [categoryId, setCategoryId] = useState<string>(
    expense?.categoryId ?? activeCategories[0]?.id ?? '',
  );
  const [amount, setAmount] = useState<string>(
    expense ? formatCentsForInput(expense.amountMinor) : '',
  );
  const [note, setNote] = useState<string>(expense?.note ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toast = useToast();
  const createMutation = useCreateActual();
  const updateMutation = useUpdateActual();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const minorCents = parseDollarsToCents(amount);
    if (!minorCents || minorCents === '0') {
      setErrorMessage('Amount must be a positive dollar value.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please select an expense category.');
      return;
    }

    if (isEditing && expense) {
      updateMutation.mutate(
        {
          id: expense.id,
          data: {
            categoryId,
            month,
            amountMinor: minorCents as PositiveMoneyMinorString,
            note: note.trim() || null,
          },
        },
        {
          onSuccess: () => {
            toast.success('Expense entry successfully updated.');
            onClose();
          },
          onError: (err) => {
            if (err instanceof ApiClientError) {
              setErrorMessage(err.message);
            } else {
              setErrorMessage('Failed to update expense entry.');
            }
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          categoryId,
          month,
          amountMinor: minorCents as PositiveMoneyMinorString,
          note: note.trim() || null,
        },
        {
          onSuccess: () => {
            toast.success('Expense entry successfully recorded.');
            onClose();
          },
          onError: (err) => {
            if (err instanceof ApiClientError) {
              setErrorMessage(err.message);
            } else {
              setErrorMessage('Failed to record expense entry.');
            }
          },
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between">
      <Drawer.Body className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-10 bg-error-lighter p-3 text-paragraph-xs font-medium text-error-dark ring-1 ring-inset ring-error-base/20"
          >
            <RiErrorWarningLine className="size-4 shrink-0 text-error-base" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Month Select */}
        <div className="space-y-1.5">
          <label className="text-label-xs font-medium text-text-sub-600">Month</label>
          <Select.Root value={month} onValueChange={setMonth}>
            <Select.Trigger aria-label="Month">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {MONTH_OPTIONS.map((m) => (
                <Select.Item key={m} value={m}>
                  {m}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        {/* Category Select */}
        <div className="space-y-1.5">
          <label className="text-label-xs font-medium text-text-sub-600">Category</label>
          <Select.Root value={categoryId} onValueChange={setCategoryId}>
            <Select.Trigger aria-label="Category">
              <Select.Value placeholder="Select a category" />
            </Select.Trigger>
            <Select.Content>
              {categories.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name} {c.archivedAt ? '(Archived)' : ''}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-label-xs font-medium text-text-sub-600">Amount (USD)</label>
          <Input.Root size="medium">
            <Input.Wrapper>
              <Input.Affix>$</Input.Affix>
              <Input.Input
                id="expense-amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
              />
            </Input.Wrapper>
          </Input.Root>
        </div>

        {/* Note Input */}
        <div className="space-y-1.5">
          <label className="text-label-xs font-medium text-text-sub-600">Note (Optional)</label>
          <Input.Root size="medium">
            <Input.Wrapper>
              <Input.Input
                id="expense-note"
                placeholder="e.g. AWS monthly invoice, Q1 ad campaign"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isPending}
              />
            </Input.Wrapper>
          </Input.Root>
        </div>
      </Drawer.Body>

      <Drawer.Footer>
        <Button.Root
          type="button"
          variant="neutral"
          mode="ghost"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button.Root>

        <Button.Root
          type="submit"
          variant="primary"
          mode="filled"
          disabled={isPending || !amount || !categoryId}
        >
          {isPending
            ? isEditing
              ? 'Saving changes...'
              : 'Recording expense...'
            : isEditing
              ? 'Save Changes'
              : 'Record Expense'}
        </Button.Root>
      </Drawer.Footer>
    </form>
  );
}
export default ExpenseDrawer;
