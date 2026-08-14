import type { ReactNode } from 'react';

import { Divider } from '../ui/divider';
import { Skeleton } from '../ui/skeleton';
import { WidgetBox, WidgetHeader } from '../ui/widget-box';

type RouteFoundationProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function RouteFoundation({ description, icon, title }: RouteFoundationProps) {
  return (
    <div className="px-4 pb-6 lg:px-8 lg:pt-1">
      <WidgetBox>
        <WidgetHeader icon={icon}>{title}</WidgetHeader>
        <Divider />
        <div className="overflow-x-auto pt-4">
          <div className="min-w-[680px]">
            <div className="grid h-11 grid-cols-[1.5fr_1fr_1fr_96px] items-center gap-5 rounded-lg bg-bg-weak-50 px-4 text-subheading-xs uppercase text-text-soft-400">
              <span>Category</span>
              <span>Period</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-stroke-soft-200">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="grid h-16 grid-cols-[1.5fr_1fr_1fr_96px] items-center gap-5 px-4"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="ml-auto h-4 w-24" />
                  <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="border-t pt-4 text-center text-paragraph-xs text-text-soft-400">
          {description}
        </p>
      </WidgetBox>
    </div>
  );
}
