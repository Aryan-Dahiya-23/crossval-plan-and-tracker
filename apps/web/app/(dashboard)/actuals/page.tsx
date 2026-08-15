import type { Metadata } from 'next';
import { RiFileList3Line } from '@remixicon/react';

import { ActualsTable } from '@/src/components/actuals/actuals-table';
import { PageHeader } from '@/src/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Actuals Ledger',
  description: 'Capture expenses and review transaction activity by month and category.',
};

export default function ActualsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<RiFileList3Line className="size-5" aria-hidden="true" />}
        title="Actuals Ledger"
        description="Capture expenses and review transaction activity by month and category."
      />

      <ActualsTable />
    </div>
  );
}
