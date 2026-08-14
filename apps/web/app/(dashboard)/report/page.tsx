import { RiBarChartBoxLine } from '@remixicon/react';

import { PageHeader } from '@/src/components/layout/page-header';
import { RouteFoundation } from '@/src/components/states/route-foundation';

export default function ReportPage() {
  return (
    <>
      <PageHeader
        icon={<RiBarChartBoxLine className="size-6" aria-hidden="true" />}
        title="Plan vs Actual report"
        description="Compare authoritative totals and variance across months and categories."
      />
      <RouteFoundation
        icon={<RiBarChartBoxLine />}
        title="Detailed report"
        description="Report filters, totals, and drill-down behavior are introduced in Phase 14."
      />
    </>
  );
}
