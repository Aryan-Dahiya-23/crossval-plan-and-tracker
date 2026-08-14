import { RiCalendarTodoLine } from '@remixicon/react';

import { PageHeader } from '@/src/components/layout/page-header';
import { RouteFoundation } from '@/src/components/states/route-foundation';

export default function PlanningPage() {
  return (
    <>
      <PageHeader
        icon={<RiCalendarTodoLine className="size-6" aria-hidden="true" />}
        title="Planning"
        description="Set and maintain monthly spending targets by category."
      />
      <RouteFoundation
        icon={<RiCalendarTodoLine />}
        title="Monthly targets"
        description="Planning controls are introduced with the financial workflows in Phase 12."
      />
    </>
  );
}
