'use client';

import * as React from 'react';
import { RiAddLine, RiSearchLine, RiUpload2Line } from '@remixicon/react';

import { useCategories } from '../../hooks/use-categories';
import * as Button from '../ui/button';
import * as Input from '../ui/input';
import * as Select from '../ui/select';

type ActualsFiltersProps = {
  search: string;
  onSearchChange: (search: string) => void;
  categoryId: string;
  onCategoryIdChange: (categoryId: string) => void;
  fromMonth: string;
  onFromMonthChange: (from: string) => void;
  toMonth: string;
  onToMonthChange: (to: string) => void;
  onAddExpense: () => void;
  onOpenImportModal: () => void;
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

export function ActualsFilters({
  categoryId,
  fromMonth,
  onAddExpense,
  onCategoryIdChange,
  onFromMonthChange,
  onOpenImportModal,
  onSearchChange,
  onToMonthChange,
  search,
  toMonth,
}: ActualsFiltersProps) {
  const { data: categories = [] } = useCategories({ includeArchived: true });

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search */}
        <div className="w-full sm:w-64">
          <Input.Root size="medium">
            <Input.Wrapper>
              <Input.Icon as={RiSearchLine} />
              <Input.Input
                id="actuals-search-input"
                placeholder="Search note..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </Input.Wrapper>
          </Input.Root>
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <Select.Root
            value={categoryId || 'all'}
            onValueChange={(val) => onCategoryIdChange(val === 'all' ? '' : val)}
          >
            <Select.Trigger aria-label="Filter by category">
              <Select.Value placeholder="All Categories" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Categories</Select.Item>
              {categories.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        {/* Month Range */}
        <div className="flex items-center gap-2">
          <div className="w-32">
            <Select.Root value={fromMonth} onValueChange={onFromMonthChange}>
              <Select.Trigger aria-label="From Month">
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
          <span className="text-text-soft-400 text-paragraph-xs">to</span>
          <div className="w-32">
            <Select.Root value={toMonth} onValueChange={onToMonthChange}>
              <Select.Trigger aria-label="To Month">
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
      </div>

      <div className="flex items-center gap-3">
        <Button.Root variant="neutral" mode="stroke" size="medium" onClick={onOpenImportModal}>
          <Button.Icon as={RiUpload2Line} />
          <span>Import CSV</span>
        </Button.Root>

        <Button.Root size="medium" onClick={onAddExpense}>
          <Button.Icon as={RiAddLine} />
          <span>Add Expense</span>
        </Button.Root>
      </div>
    </div>
  );
}
export default ActualsFilters;
