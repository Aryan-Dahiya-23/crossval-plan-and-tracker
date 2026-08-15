/**
 * Format string minor integer cents (e.g. "500000", "-20000") into human-readable USD (e.g. "$5,000.00", "-$200.00").
 */
export function formatCentsToDollars(
  centsStr: string | null | undefined,
  options: {
    showDecimals?: boolean;
    fallback?: string;
  } = {},
): string {
  const { fallback = '—', showDecimals = true } = options;

  if (centsStr === null || centsStr === undefined || centsStr.trim() === '') {
    return fallback;
  }

  try {
    const val = BigInt(centsStr.trim());
    const isNegative = val < 0n;
    const absVal = isNegative ? -val : val;
    const dollars = absVal / 100n;
    const cents = absVal % 100n;

    const formattedDollars = Number(dollars).toLocaleString('en-US');

    if (!showDecimals && cents === 0n) {
      return `${isNegative ? '-' : ''}$${formattedDollars}`;
    }

    const paddedCents = cents.toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}$${formattedDollars}.${paddedCents}`;
  } catch {
    return fallback;
  }
}

/**
 * Format string minor integer cents for editable inputs (e.g. "500000" -> "5000.00" or "5000").
 */
export function formatCentsForInput(centsStr: string | null | undefined): string {
  if (centsStr === null || centsStr === undefined || centsStr.trim() === '') {
    return '';
  }

  try {
    const val = BigInt(centsStr.trim());
    const isNegative = val < 0n;
    const absVal = isNegative ? -val : val;
    const dollars = absVal / 100n;
    const cents = absVal % 100n;

    if (cents === 0n) {
      return `${isNegative ? '-' : ''}${dollars.toString()}`;
    }

    return `${isNegative ? '-' : ''}${dollars.toString()}.${cents.toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/**
 * Parse user currency input (e.g. "$5,000", "5000.50", "0") into minor integer cents string (e.g. "500000", "500050", "0").
 * Returns null for blank/empty input.
 */
export function parseDollarsToCents(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;

  const cleaned = input.replace(/[$,\s]/g, '');
  if (cleaned === '') return null;

  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;

  const isNegative = match[1] === '-';
  const dollarsStr = match[2] ?? '0';
  const centsStr = (match[3] ?? '').padEnd(2, '0').slice(0, 2);

  try {
    const dollars = BigInt(dollarsStr);
    const cents = BigInt(centsStr);
    const total = dollars * 100n + cents;
    return (isNegative ? -total : total).toString();
  } catch {
    return null;
  }
}
