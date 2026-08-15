import type { ReactNode } from 'react';

import { AuthGuard } from '@/src/components/auth/auth-guard';
import { AppShell } from '@/src/components/layout/app-shell';

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
