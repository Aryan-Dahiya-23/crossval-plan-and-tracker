import { RiFileList3Line } from '@remixicon/react';

import { PageHeader } from '@/src/components/layout/page-header';
import { RouteFoundation } from '@/src/components/states/route-foundation';

export default function ActualsPage() {
  return (
    <>
      <PageHeader
        icon={<RiFileList3Line className="size-6" aria-hidden="true" />}
        title="Actuals"
        description="Capture expenses and review activity by month and category."
      />
      <RouteFoundation
        icon={<RiFileList3Line />}
        title="Actual entries"
        description="Entry and editing controls are introduced with the financial workflows in Phase 12."
      />
    </>
  );
}
