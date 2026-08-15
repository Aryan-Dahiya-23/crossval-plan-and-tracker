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
import { PageLoadingState } from '@/src/components/ui/loading-state';
import { WidgetBox } from '@/src/components/ui/widget-box';
import { usePrefetchRoute } from '@/src/hooks/use-prefetch';
import { usePlanVsActualReport } from '@/src/hooks/use-reports';

export function DashboardView() {
  const { prefetchRoute } = usePrefetchRoute();
  const { data: report, isLoading } = usePlanVsActualReport({
    from: '2026-01',
    to: '2026-12',
  });

  const hasData =
    Boolean(report) && (report!.summary.planMinor !== '0' || report!.summary.actualMinor !== '0');

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<RiDashboardLine className="size-5" aria-hidden="true" />}
        title="Financial Overview"
        description="Authoritative executive metrics, budget targets, actual spend, and net variance."
      />

      <ReviewerGuide />

      {isLoading ? (
        <PageLoadingState
          message="Loading Financial Overview"
          subMessage="Fetching authoritative budget targets, expenses, and variance metrics..."
        />
      ) : (
        <>
          <SampleDataCTA hasData={hasData} isLoading={isLoading} />

          {report ? (
            <div className="space-y-6">
              <KPICards
                planMinor={report.summary.planMinor}
                actualMinor={report.summary.actualMinor}
                varianceMinor={report.summary.varianceMinor}
                variancePercent={report.summary.variancePercent}
                overPlanCategoryCount={report.summary.overPlanCategoryCount}
              />

              <SpendingChart monthlySeries={report.monthlySeries} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                  href="/planning"
                  onMouseEnter={() => prefetchRoute('/planning')}
                  onFocus={() => prefetchRoute('/planning')}
                  className="group block"
                >
                  <WidgetBox className="p-5 transition-all duration-200 hover:shadow-regular-sm hover:border-stroke-sub-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-primary-lighter text-primary-base ring-1 ring-inset ring-primary-base/20">
                          <RiCalendarTodoLine className="size-4.5" />
                        </span>
                        <div>
                          <h3 className="text-label-sm font-semibold text-text-strong group-hover:text-primary-base transition-colors">
                            12-Month Planning
                          </h3>
                          <p className="text-paragraph-xs text-text-sub-600">
                            Maintain annual spending targets
                          </p>
                        </div>
                      </div>
                      <RiArrowRightLine className="size-4 text-text-soft-400 group-hover:text-primary-base group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </WidgetBox>
                </Link>

                <Link
                  href="/actuals"
                  onMouseEnter={() => prefetchRoute('/actuals')}
                  onFocus={() => prefetchRoute('/actuals')}
                  className="group block"
                >
                  <WidgetBox className="p-5 transition-all duration-200 hover:shadow-regular-sm hover:border-stroke-sub-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20">
                          <RiFileList3Line className="size-4.5" />
                        </span>
                        <div>
                          <h3 className="text-label-sm font-semibold text-text-strong group-hover:text-amber-600 transition-colors">
                            Actuals Ledger
                          </h3>
                          <p className="text-paragraph-xs text-text-sub-600">
                            Record and audit expenses
                          </p>
                        </div>
                      </div>
                      <RiArrowRightLine className="size-4 text-text-soft-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </WidgetBox>
                </Link>

                <Link
                  href="/report"
                  onMouseEnter={() => prefetchRoute('/report')}
                  onFocus={() => prefetchRoute('/report')}
                  className="group block"
                >
                  <WidgetBox className="p-5 transition-all duration-200 hover:shadow-regular-sm hover:border-stroke-sub-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                          <RiLineChartLine className="size-4.5" />
                        </span>
                        <div>
                          <h3 className="text-label-sm font-semibold text-text-strong group-hover:text-emerald-600 transition-colors">
                            Plan vs Actual Report
                          </h3>
                          <p className="text-paragraph-xs text-text-sub-600">
                            Analyze variances and locks
                          </p>
                        </div>
                      </div>
                      <RiArrowRightLine className="size-4 text-text-soft-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </WidgetBox>
                </Link>
              </div>
            </div>
          ) : (
            <WidgetBox className="p-8 text-center text-text-sub-600">
              Unable to load financial dashboard metrics.
            </WidgetBox>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardView;
