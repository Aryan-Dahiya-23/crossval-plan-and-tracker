/**
 * Escape a cell value for RFC-4180 CSV compliance and formula injection prevention.
 * Cells starting with '=', '+', '-', '@', '\t', or '\r' are escaped with a leading tab.
 */
export function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Formula injection defense: prepend tab if the cell starts with a formula trigger
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `\t${str}`;
  }

  // If the cell contains quotes, commas, or newlines, wrap in double quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate a CSV string from an array of rows with proper header and row escaping.
 */
export function generateCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const headerLine = headers.map((h) => sanitizeCsvCell(h)).join(',');
  const rowLines = rows.map((row) => row.map((cell) => sanitizeCsvCell(cell)).join(','));

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Trigger a browser download of a CSV file.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
