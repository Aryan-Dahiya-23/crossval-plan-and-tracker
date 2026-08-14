'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';

import { TooltipProvider } from '@/src/components/ui/tooltip';
import { createQueryClient } from '@/src/lib/query-client';

const QueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () => import('@tanstack/react-query-devtools').then((module) => module.ReactQueryDevtools),
        { ssr: false },
      )
    : null;

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        {QueryDevtools && <QueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
