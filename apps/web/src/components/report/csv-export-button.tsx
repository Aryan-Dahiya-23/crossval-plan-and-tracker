'use client';

import * as React from 'react';
import { type ReportDto } from '@crossval/contracts';
import { RiDownloadLine } from '@remixicon/react';

import { downloadCsv, generateCsv } from '../../lib/csv-sanitizer';
import { formatCentsToDollars } from '../../lib/money-format';
import * as Button from '../ui/button';

export function CsvExportButton({ report }: { report?: ReportDto | null | undefined }) {
  const handleExport = () => {
    if (!report) return;

    const headers = [
      'Category',
      'Month',
      'Planned Target ($)',
      'Actual Spend ($)',
      'Variance ($)',
      'Variance (%)',
      'Locked',
    ];

    const rows: (string | number)[][] = [];

    for (const cat of report.categories) {
      for (const m of cat.months) {
        rows.push([
          cat.category.name,
          m.month,
          formatCentsToDollars(m.planMinor, { fallback: '$0.00' }),
          formatCentsToDollars(m.actualMinor, { fallback: '$0.00' }),
          formatCentsToDollars(m.varianceMinor),
          m.variancePercent ?? 'N/A',
          m.locked ? 'YES' : 'NO',
        ]);
      }

      // Category Subtotal Row
      rows.push([
        `${cat.category.name} (Subtotal)`,
        `Period Total`,
        formatCentsToDollars(cat.subtotal.planMinor),
        formatCentsToDollars(cat.subtotal.actualMinor),
        formatCentsToDollars(cat.subtotal.varianceMinor),
        cat.subtotal.variancePercent ?? 'N/A',
        '-',
      ]);
    }

    // Grand Total Row
    rows.push([
      'GRAND TOTAL',
      `${report.range.from} to ${report.range.to}`,
      formatCentsToDollars(report.summary.planMinor),
      formatCentsToDollars(report.summary.actualMinor),
      formatCentsToDollars(report.summary.varianceMinor),
      report.summary.variancePercent ?? 'N/A',
      '-',
    ]);

    const csvContent = generateCsv(headers, rows);
    const filename = `plan-vs-actual-report-${report.range.from}-to-${report.range.to}.csv`;
    downloadCsv(filename, csvContent);
  };

  return (
    <Button.Root
      variant="neutral"
      mode="stroke"
      size="medium"
      onClick={handleExport}
      disabled={!report}
    >
      <Button.Icon as={RiDownloadLine} />
      <span>Export CSV</span>
    </Button.Root>
  );
}
export default CsvExportButton;
