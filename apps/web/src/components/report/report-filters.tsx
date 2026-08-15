'use client';

import * as React from 'react';
import { type ReportDto } from '@crossval/contracts';
import { RiLockLine } from '@remixicon/react';

import { useCategories } from '../../hooks/use-categories';
import * as Button from '../ui/button';
import * as Select from '../ui/select';
import { CsvExportButton } from './csv-export-button';

type ReportFiltersProps = {
  fromMonth: string;
  toMonth: string;
  categoryId: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onOpenLockModal: () => void;
  report?: ReportDto | null | undefined;
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

export function ReportFilters({
  categoryId,
  fromMonth,
  onCategoryChange,
  onFromChange,
  onOpenLockModal,
  onToChange,
  report,
  toMonth,
}: ReportFiltersProps) {
  const { data: categories = [] } = useCategories({ includeArchived: true });

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Month Range Selectors */}
        <div className="flex items-center gap-2">
          <div className="w-32">
            <Select.Root value={fromMonth} onValueChange={onFromChange}>
              <Select.Trigger aria-label="From month">
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
          <span className="text-paragraph-xs text-text-soft-400">to</span>
          <div className="w-32">
            <Select.Root value={toMonth} onValueChange={onToChange}>
              <Select.Trigger aria-label="To month">
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
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <Select.Root
            value={categoryId || 'all'}
            onValueChange={(val) => onCategoryChange(val === 'all' ? '' : val)}
          >
            <Select.Trigger aria-label="Filter by category">
              <Select.Value placeholder="All Categories" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Categories</Select.Item>
              {categories.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name} {c.archivedAt ? '(Archived)' : ''}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button.Root variant="neutral" mode="stroke" size="medium" onClick={onOpenLockModal}>
          <Button.Icon as={RiLockLine} className="text-warning-base" />
          <span>Lock Period</span>
        </Button.Root>
        <CsvExportButton report={report} />
      </div>
    </div>
  );
}
export default ReportFilters;
