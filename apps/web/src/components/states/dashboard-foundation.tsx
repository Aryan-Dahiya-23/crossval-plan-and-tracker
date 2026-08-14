import { RiBarChart2Line, RiCalendarLine, RiFundsBoxLine, RiPieChartLine } from '@remixicon/react';
import type { ReactNode } from 'react';

import { Divider } from '../ui/divider';
import { WidgetBox, WidgetHeader } from '../ui/widget-box';

const metrics: Array<{ label: string; caption: string; icon: ReactNode }> = [
  {
    label: 'Total planned',
    caption: 'Selected period',
    icon: <RiCalendarLine className="size-5" />,
  },
  {
    label: 'Total actual',
    caption: 'Selected period',
    icon: <RiFundsBoxLine className="size-5" />,
  },
  {
    label: 'Net variance',
    caption: 'Actual minus plan',
    icon: <RiBarChart2Line className="size-5" />,
  },
  {
    label: 'Categories over plan',
    caption: 'Selected period',
    icon: <RiPieChartLine className="size-5" />,
  },
];

function MetricCard({ caption, icon, label }: (typeof metrics)[number]) {
  return (
    <WidgetBox className="relative min-h-[148px] overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-paragraph-sm text-text-sub-600">{label}</p>
          <p className="mt-2 text-title-h5 tabular-nums text-text-strong-950">—</p>
        </div>
        <span className="grid size-10 place-items-center rounded-full bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
          {icon}
        </span>
      </div>
      <div className="absolute inset-x-5 bottom-5 flex items-center gap-2 text-paragraph-xs text-text-soft-400">
        <span className="size-1.5 rounded-full bg-stroke-sub-300" />
        {caption}
      </div>
    </WidgetBox>
  );
}

function EmptyChart() {
  return (
    <div className="relative flex min-h-[232px] flex-col items-center justify-center overflow-hidden rounded-12 bg-bg-weak-50/60 px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-evenly opacity-80"
        aria-hidden="true"
      >
        <span className="h-px w-full bg-stroke-soft-200" />
        <span className="h-px w-full bg-stroke-soft-200" />
        <span className="h-px w-full bg-stroke-soft-200" />
        <span className="h-px w-full bg-stroke-soft-200" />
      </div>
      <div className="relative grid size-12 place-items-center rounded-full bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
        <RiBarChart2Line className="size-6" aria-hidden="true" />
      </div>
      <p className="relative mt-4 text-label-sm text-text-strong-950">No activity to compare yet</p>
      <p className="relative mt-1 max-w-xs text-paragraph-xs text-text-soft-400">
        Plan and actual values will populate this chart for the selected period.
      </p>
    </div>
  );
}

function CategorySummary() {
  const rows = ['Planned', 'Actual', 'Variance'];

  return (
    <div className="flex min-h-[232px] flex-col">
      <div className="flex items-center justify-between pb-3 text-subheading-xs uppercase text-text-soft-400">
        <span>Measure</span>
        <span>Amount</span>
      </div>
      <Divider />
      <div className="divide-y divide-stroke-soft-200">
        {rows.map((label, index) => (
          <div key={label} className="flex h-14 items-center gap-3">
            <span
              className={
                index === 0
                  ? 'size-2 rounded-full bg-primary-base'
                  : index === 1
                    ? 'size-2 rounded-full bg-warning-base'
                    : 'size-2 rounded-full bg-stroke-sub-300'
              }
            />
            <span className="flex-1 text-paragraph-sm text-text-sub-600">{label}</span>
            <span className="text-label-sm tabular-nums text-text-strong-950">—</span>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-lg bg-bg-weak-50 px-3 py-2 text-paragraph-xs text-text-soft-400 ring-1 ring-inset ring-stroke-soft-200">
        Values are calculated by the reporting API.
      </div>
    </div>
  );
}

export function DashboardFoundation() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-6 lg:px-8 lg:pt-1">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <WidgetBox>
          <WidgetHeader icon={<RiBarChart2Line />}>Monthly variance</WidgetHeader>
          <Divider />
          <div className="pt-4">
            <EmptyChart />
          </div>
        </WidgetBox>

        <WidgetBox>
          <WidgetHeader icon={<RiPieChartLine />}>Category summary</WidgetHeader>
          <Divider />
          <div className="pt-4">
            <CategorySummary />
          </div>
        </WidgetBox>
      </div>
    </div>
  );
}
