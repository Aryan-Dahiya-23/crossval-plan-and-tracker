'use client';

import * as React from 'react';
import { RiCalendarLine, RiCheckLine, RiHistoryLine, RiSave3Line } from '@remixicon/react';

import * as Button from '../ui/button';
import * as FancyButton from '../ui/fancy-button';
import * as Select from '../ui/select';

type PlanningHeaderProps = {
  year: number;
  onYearChange: (year: number) => void;
  dirtyCount: number;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
};

export function PlanningHeader({
  dirtyCount,
  isSaving,
  onReset,
  onSave,
  onYearChange,
  year,
}: PlanningHeaderProps) {
  const isDirty = dirtyCount > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div className="flex items-center gap-2 text-label-xs text-text-sub-600">
        <span className="grid size-6 place-items-center rounded-md bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
          <RiCalendarLine className="size-3.5" />
        </span>
        <span className="font-semibold text-text-strong">Fiscal Year {year}</span>
        <span>•</span>
        <span>12-Month Category Budget Matrix</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-32">
          <Select.Root
            value={year.toString()}
            onValueChange={(val) => onYearChange(parseInt(val, 10))}
          >
            <Select.Trigger aria-label="Planning Year">
              <Select.Value placeholder="Select Year" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="2025">2025</Select.Item>
              <Select.Item value="2026">2026</Select.Item>
              <Select.Item value="2027">2027</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        {isDirty && (
          <Button.Root
            variant="neutral"
            mode="ghost"
            size="medium"
            onClick={onReset}
            disabled={isSaving}
          >
            <Button.Icon as={RiHistoryLine} />
            <span>Reset</span>
          </Button.Root>
        )}

        <FancyButton.Root
          variant={isDirty ? 'primary' : 'neutral'}
          size="medium"
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : isDirty ? (
            <>
              <FancyButton.Icon as={RiSave3Line} />
              <span>Save Changes ({dirtyCount})</span>
            </>
          ) : (
            <>
              <FancyButton.Icon as={RiCheckLine} />
              <span>All Saved</span>
            </>
          )}
        </FancyButton.Root>
      </div>
    </div>
  );
}

export default PlanningHeader;
