import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from './providers';

import './styles.css';

export const metadata: Metadata = {
  title: 'CrossVal Plan vs Actual',
  description: 'Plan vs Actual financial tracking dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
