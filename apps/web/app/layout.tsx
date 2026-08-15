import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppProviders } from '@/src/providers/app-providers';

import './styles.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://crossval-plan-and-tracker-web.vercel.app'),
  title: {
    default: 'CrossVal — Plan vs Actual Financial Tracker',
    template: '%s | CrossVal Plan vs Actual',
  },
  description:
    'Authoritative B2B FP&A dashboard for 12-month budget planning, expense ledger tracking, variance analysis, and period locking.',
  keywords: [
    'CrossVal',
    'FP&A',
    'Plan vs Actual',
    'Financial Planning',
    'Budget Matrix',
    'Expense Tracker',
    'Variance Analysis',
  ],
  authors: [{ name: 'CrossVal Team' }],
  creator: 'CrossVal',
  openGraph: {
    title: 'CrossVal — Plan vs Actual Financial Tracker',
    description:
      'Authoritative B2B FP&A dashboard for 12-month budget planning, expense ledger tracking, variance analysis, and period locking.',
    url: 'https://crossval-plan-and-tracker-web.vercel.app',
    siteName: 'CrossVal Plan vs Actual',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrossVal — Plan vs Actual Financial Tracker',
    description:
      'Authoritative B2B FP&A dashboard for 12-month budget planning, expense ledger tracking, variance analysis, and period locking.',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
