'use client';

import * as React from 'react';
import { RiCheckLine, RiHistoryLine, RiSave3Line } from '@remixicon/react';

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6">
      <div>
        <h1 className="text-title-h5 font-medium text-text-strong">Annual Planning Matrix</h1>
        <p className="text-paragraph-sm text-text-sub-600">
          Set monthly budget targets for each expense category across all 12 months.
        </p>
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
              <span>Save Targets ({dirtyCount})</span>
            </>
          ) : (
            <>
              <FancyButton.Icon as={RiCheckLine} />
              <span>Targets Saved</span>
            </>
          )}
        </FancyButton.Root>
      </div>
    </div>
  );
}
export default PlanningHeader;
