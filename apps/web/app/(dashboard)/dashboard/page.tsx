import { RiDashboardLine } from '@remixicon/react';

import { PageHeader } from '@/src/components/layout/page-header';
import { DashboardFoundation } from '@/src/components/states/dashboard-foundation';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        icon={<RiDashboardLine className="size-6" aria-hidden="true" />}
        title="Overview"
        description="Monitor monthly plans, actual spend, and variance from one workspace."
      />
      <DashboardFoundation />
    </>
  );
}
