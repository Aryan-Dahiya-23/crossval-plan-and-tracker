import { RiCalendarTodoLine } from '@remixicon/react';

import { PageHeader } from '@/src/components/layout/page-header';
import { PlanningGrid } from '@/src/components/planning/planning-grid';

export default function PlanningPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<RiCalendarTodoLine className="size-6" aria-hidden="true" />}
        title="Planning"
        description="Set and maintain monthly spending targets by category."
      />

      <PlanningGrid />
    </div>
  );
}
