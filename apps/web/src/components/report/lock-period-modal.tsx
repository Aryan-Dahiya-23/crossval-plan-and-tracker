'use client';

import * as React from 'react';
import { RiAlertLine, RiLockLine } from '@remixicon/react';
import { useState } from 'react';

import { useLockPeriod } from '../../hooks/use-periods';
import { ApiClientError } from '../../lib/api-client';
import * as Button from '../ui/button';
import * as Modal from '../ui/modal';
import * as Select from '../ui/select';
import { useToast } from '../ui/toast';

type LockPeriodModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMonth?: string;
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

export function LockPeriodModal({
  defaultMonth = '2026-01',
  onOpenChange,
  open,
}: LockPeriodModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toast = useToast();
  const lockMutation = useLockPeriod();

  const handleLock = () => {
    setErrorMessage(null);
    lockMutation.mutate(selectedMonth, {
      onSuccess: () => {
        toast.warning(`Period ${selectedMonth} is now permanently locked.`);
        onOpenChange(false);
      },
      onError: (err) => {
        if (err instanceof ApiClientError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Unable to lock financial period.');
        }
      },
    });
  };

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <Modal.Header
          icon={RiLockLine}
          title="Lock Financial Period"
          description="Irrevocably close a month to prevent further mutations."
        />

        <Modal.Body className="space-y-4">
          <div className="rounded-xl bg-warning-lighter/60 p-3.5 ring-1 ring-inset ring-warning-base/20 text-paragraph-xs text-warning-dark">
            <div className="flex gap-2">
              <RiAlertLine className="size-4 shrink-0" />
              <span>
                <strong>Warning:</strong> Period locking is permanent. Once locked, planned targets
                and actual expenses for this month can never be added, modified, or deleted.
              </span>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg bg-error-lighter p-2.5 text-paragraph-xs font-medium text-error-dark"
            >
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-label-xs font-medium text-text-sub-600">Month to Lock</label>
            <Select.Root value={selectedMonth} onValueChange={setSelectedMonth}>
              <Select.Trigger aria-label="Month to Lock">
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
        </Modal.Body>

        <Modal.Footer>
          <Button.Root
            type="button"
            variant="neutral"
            mode="ghost"
            onClick={() => onOpenChange(false)}
            disabled={lockMutation.isPending}
          >
            Cancel
          </Button.Root>
          <Button.Root
            type="button"
            variant="error"
            mode="filled"
            onClick={handleLock}
            disabled={lockMutation.isPending}
          >
            {lockMutation.isPending ? 'Locking period...' : `Lock ${selectedMonth}`}
          </Button.Root>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
export default LockPeriodModal;
