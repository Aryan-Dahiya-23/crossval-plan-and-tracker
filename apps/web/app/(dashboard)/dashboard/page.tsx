import type { Metadata } from 'next';

import { DashboardView } from '@/src/components/dashboard/dashboard-view';

export const metadata: Metadata = {
  title: 'Executive Overview',
  description: 'Authoritative executive metrics, budget targets, actual spend, and net variance.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
