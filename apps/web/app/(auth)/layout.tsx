import type { ReactNode } from 'react';

import { AuthPreview } from '@/src/components/layout/auth-preview';
import { Brand } from '@/src/components/layout/brand';

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="grid min-h-screen bg-bg-white-0 lg:grid-cols-[minmax(0,608fr)_minmax(0,832fr)] xl:grid-cols-[608px_minmax(0,1fr)]">
      <section className="flex min-h-screen flex-col px-6 lg:px-11 lg:py-6">
        <div className="flex h-[68px] items-center lg:h-auto">
          <Brand href="/" />
        </div>
        <div className="flex flex-1 flex-col py-10 lg:py-20 min-[901px]:justify-center">
          <div className="mx-auto flex w-full max-w-[392px] flex-col gap-6">{children}</div>
        </div>
        <p className="pb-6 text-center text-paragraph-xs text-text-soft-400 lg:text-left">
          © 2026 CrossVal. Plan vs Actual Tracker.
        </p>
      </section>

      <section className="hidden p-2 pl-0 lg:block">
        <AuthPreview />
      </section>
    </main>
  );
}
