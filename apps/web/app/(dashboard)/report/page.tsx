import type { Metadata } from 'next';

import { ReportView } from '@/src/components/report/report-view';

export const metadata: Metadata = {
  title: 'Plan vs Actual Report',
  description:
    'Authoritative financial comparison, category subtotals, variance calculations, and transaction drill-down.',
};

export default function ReportPage() {
  return <ReportView />;
}
