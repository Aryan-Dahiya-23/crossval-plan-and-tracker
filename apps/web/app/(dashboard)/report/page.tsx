'use client';

import { RiBarChartBoxLine } from '@remixicon/react';
import { useState } from 'react';

import { PageHeader } from '@/src/components/layout/page-header';
import { LockPeriodModal } from '@/src/components/report/lock-period-modal';
import { ReportFilters } from '@/src/components/report/report-filters';
import { ReportTable } from '@/src/components/report/report-table';
import { Skeleton } from '@/src/components/ui/skeleton';
import { WidgetBox } from '@/src/components/ui/widget-box';
import { usePlanVsActualReport } from '@/src/hooks/use-reports';

export default function ReportPage() {
  const [fromMonth, setFromMonth] = useState('2026-01');
  const [toMonth, setToMonth] = useState('2026-12');
  const [categoryId, setCategoryId] = useState('');
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const { data: report, isLoading } = usePlanVsActualReport({
    from: fromMonth,
    to: toMonth,
    categoryId: categoryId || undefined,
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<RiBarChartBoxLine className="size-6" aria-hidden="true" />}
        title="Plan vs Actual Report"
        description="Authoritative financial comparison, category subtotals, variance calculations, and transaction drill-down."
      />

      <ReportFilters
        fromMonth={fromMonth}
        toMonth={toMonth}
        categoryId={categoryId}
        onFromChange={setFromMonth}
        onToChange={setToMonth}
        onCategoryChange={setCategoryId}
        onOpenLockModal={() => setLockModalOpen(true)}
        report={report}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-12" />
          <Skeleton className="h-64 w-full rounded-16" />
        </div>
      ) : report ? (
        <ReportTable report={report} />
      ) : (
        <WidgetBox className="p-8 text-center text-text-sub-600">
          Unable to generate plan vs actual financial report.
        </WidgetBox>
      )}

      <LockPeriodModal
        open={lockModalOpen}
        onOpenChange={setLockModalOpen}
        defaultMonth={fromMonth}
      />
    </div>
  );
}
