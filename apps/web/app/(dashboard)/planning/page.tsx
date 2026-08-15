import type { Metadata } from 'next';
import { RiCalendarTodoLine } from '@remixicon/react';

import { PageHeader } from '@/src/components/layout/page-header';
import { PlanningGrid } from '@/src/components/planning/planning-grid';

export const metadata: Metadata = {
  title: 'Annual Planning Matrix',
  description: 'Set and maintain 12-month budget targets by category.',
};

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<RiCalendarTodoLine className="size-5" aria-hidden="true" />}
        title="Planning"
        description="Set and maintain monthly spending targets by category."
      />

      <PlanningGrid />
    </div>
  );
}
