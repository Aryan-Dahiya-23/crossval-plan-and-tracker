'use client';

import * as React from 'react';
import { RiAlertLine } from '@remixicon/react';

import { useDeleteActual } from '../../hooks/use-actuals';
import { formatCentsToDollars } from '../../lib/money-format';
import * as Button from '../ui/button';
import * as Modal from '../ui/modal';
import { useToast } from '../ui/toast';

type DeleteExpenseModalProps = {
  expense: { id: string; amountMinor: string; month: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteExpenseModal({ expense, onOpenChange, open }: DeleteExpenseModalProps) {
  const toast = useToast();
  const deleteMutation = useDeleteActual();

  if (!expense) return null;

  const handleDelete = () => {
    deleteMutation.mutate(expense.id, {
      onSuccess: () => {
        toast.success('Expense entry deleted.');
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Failed to delete expense entry. Period may be locked.');
      },
    });
  };

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <Modal.Header
          icon={RiAlertLine}
          title="Delete Expense Entry"
          description="This action is irreversible and removes the entry from calculations."
        />

        <Modal.Body className="text-paragraph-sm text-text-sub-600">
          Are you sure you want to permanently delete this expense of{' '}
          <strong className="font-semibold text-text-strong">
            {formatCentsToDollars(expense.amountMinor)}
          </strong>{' '}
          recorded in period <span className="font-medium text-text-strong">{expense.month}</span>?
        </Modal.Body>

        <Modal.Footer>
          <Button.Root
            type="button"
            variant="neutral"
            mode="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button.Root>
          <Button.Root
            type="button"
            variant="error"
            mode="filled"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Expense'}
          </Button.Root>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
export default DeleteExpenseModal;
