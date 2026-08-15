'use client';

import {
  RiArrowRightLine,
  RiCalendarTodoLine,
  RiDashboardLine,
  RiFileList3Line,
  RiLineChartLine,
} from '@remixicon/react';
import Link from 'next/link';

import { KPICards } from '@/src/components/dashboard/kpi-cards';
import { ReviewerGuide } from '@/src/components/dashboard/reviewer-guide';
import { SampleDataCTA } from '@/src/components/dashboard/sample-data-cta';
import { SpendingChart } from '@/src/components/dashboard/spending-chart';
import { PageHeader } from '@/src/components/layout/page-header';
import { Skeleton } from '@/src/components/ui/skeleton';
import { WidgetBox } from '@/src/components/ui/widget-box';
import { usePrefetchRoute } from '@/src/hooks/use-prefetch';
import { usePlanVsActualReport } from '@/src/hooks/use-reports';

export default function DashboardPage() {
  const { prefetchRoute } = usePrefetchRoute();
  const { data: report, isLoading } = usePlanVsActualReport({
    from: '2026-01',
    to: '2026-12',
  });

  const hasData =
    Boolean(report) && (report!.summary.planMinor !== '0' || report!.summary.actualMinor !== '0');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<RiDashboardLine className="size-6" aria-hidden="true" />}
        title="Financial Overview"
        description="Authoritative executive metrics, budget targets, actual spend, and net variance."
      />

      {/* Assignment Rubric & Domain Rules Guide */}
      <ReviewerGuide />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-16" />
            <Skeleton className="h-28 rounded-16" />
            <Skeleton className="h-28 rounded-16" />
            <Skeleton className="h-28 rounded-16" />
          </div>
          <Skeleton className="h-80 rounded-16" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Sample Data CTA for Clean Accounts */}
          <SampleDataCTA hasData={hasData} />

          {/* 4 KPI Scorecards */}
          <KPICards
            planMinor={report.summary.planMinor}
            actualMinor={report.summary.actualMinor}
            varianceMinor={report.summary.varianceMinor}
            variancePercent={report.summary.variancePercent}
            overPlanCategoryCount={report.summary.overPlanCategoryCount}
          />

          {/* Spending Comparison Chart */}
          <SpendingChart monthlySeries={report.monthlySeries} />

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/planning"
              onMouseEnter={() => prefetchRoute('/planning')}
              onFocus={() => prefetchRoute('/planning')}
              onTouchStart={() => prefetchRoute('/planning')}
              className="group block rounded-16 bg-bg-white-0 p-5 ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50/50 hover:ring-stroke-sub-300"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-9 bg-primary-lighter text-primary-base">
                  <RiCalendarTodoLine className="size-5" />
                </span>
                <RiArrowRightLine className="size-4 text-text-sub-600 transition group-hover:translate-x-1" />
              </div>
              <h4 className="pt-3 text-label-sm font-semibold text-text-strong-950">
                Planning Spreadsheet
              </h4>
              <p className="text-paragraph-xs text-text-sub-600">
                Edit 12-month budget targets by category
              </p>
            </Link>

            <Link
              href="/actuals"
              onMouseEnter={() => prefetchRoute('/actuals')}
              onFocus={() => prefetchRoute('/actuals')}
              onTouchStart={() => prefetchRoute('/actuals')}
              className="group block rounded-16 bg-bg-white-0 p-5 ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50/50 hover:ring-stroke-sub-300"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-9 bg-emerald-50 text-emerald-600">
                  <RiFileList3Line className="size-5" />
                </span>
                <RiArrowRightLine className="size-4 text-text-sub-600 transition group-hover:translate-x-1" />
              </div>
              <h4 className="pt-3 text-label-sm font-semibold text-text-strong-950">
                Expense Ledger
              </h4>
              <p className="text-paragraph-xs text-text-sub-600">
                Record and manage actual transaction entries
              </p>
            </Link>

            <Link
              href="/report"
              onMouseEnter={() => prefetchRoute('/report')}
              onFocus={() => prefetchRoute('/report')}
              onTouchStart={() => prefetchRoute('/report')}
              className="group block rounded-16 bg-bg-white-0 p-5 ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50/50 hover:ring-stroke-sub-300"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-9 bg-purple-50 text-purple-600">
                  <RiLineChartLine className="size-5" />
                </span>
                <RiArrowRightLine className="size-4 text-text-sub-600 transition group-hover:translate-x-1" />
              </div>
              <h4 className="pt-3 text-label-sm font-semibold text-text-strong-950">
                Plan vs Actual Report
              </h4>
              <p className="text-paragraph-xs text-text-sub-600">
                Detailed breakdowns, drill-down & CSV export
              </p>
            </Link>
          </div>
        </div>
      ) : (
        <WidgetBox className="p-8 text-center text-text-sub-600">
          Unable to load financial report data.
        </WidgetBox>
      )}
    </div>
  );
}
