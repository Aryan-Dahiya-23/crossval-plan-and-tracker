import { monthStringRegex } from '@crossval/contracts';

/**
 * Pure integer month conversion, validation, and range iteration utilities.
 *
 * Avoids Date objects and timezone-dependent operations to prevent DST and locale drift.
 */

export const MAX_MONTH_RANGE_COUNT = 60;

export interface MonthComponents {
  year: number;
  month: number;
}

/**
 * Validates whether a string matches the canonical YYYY-MM format with valid month 01-12.
 */
export function isValidMonthString(monthStr: string): boolean {
  return typeof monthStr === 'string' && monthStringRegex.test(monthStr);
}

/**
 * Validates whether a number is a valid YYYYMM integer (e.g. 202601 - 202612).
 */
export function isValidMonthKey(key: number): boolean {
  if (!Number.isInteger(key) || key < 100001 || key > 999912) {
    return false;
  }
  const month = key % 100;
  return month >= 1 && month <= 12;
}

/**
 * Converts a YYYYMM integer key to year and month components.
 */
export function monthKeyToComponents(key: number): MonthComponents {
  if (!isValidMonthKey(key)) {
    throw new Error(
      `Invalid month key: ${key}. Expected YYYYMM integer with month between 01 and 12.`,
    );
  }

  const year = Math.floor(key / 100);
  const month = key % 100;

  return { year, month };
}

/**
 * Constructs a YYYYMM integer key from year and month numbers.
 */
export function componentsToMonthKey(year: number, month: number): number {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error(`Invalid year: ${year}. Expected 4-digit year.`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Expected integer between 1 and 12.`);
  }

  return year * 100 + month;
}

/**
 * Converts an API month string ("YYYY-MM") to database integer key (YYYYMM).
 */
export function apiMonthToDbKey(monthStr: string): number {
  if (!isValidMonthString(monthStr)) {
    throw new Error(`Invalid month format: "${monthStr}". Expected YYYY-MM between 01 and 12.`);
  }

  const parts = monthStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);

  return componentsToMonthKey(year, month);
}

/**
 * Converts a database integer key (YYYYMM) to canonical API month string ("YYYY-MM").
 */
export function dbKeyToApiMonth(key: number): string {
  const { year, month } = monthKeyToComponents(key);
  const formattedMonth = month.toString().padStart(2, '0');
  return `${year}-${formattedMonth}`;
}

/**
 * Generates an inclusive array of YYYYMM integer keys from fromKey to toKey.
 *
 * Invariants:
 * - fromKey <= toKey
 * - Total count <= MAX_MONTH_RANGE_COUNT (60 months)
 * - Pure integer arithmetic; roll-over from month 12 to month 1 of next year.
 */
export function monthRange(fromKey: number, toKey: number): number[] {
  if (!isValidMonthKey(fromKey)) {
    throw new Error(`Invalid fromKey: ${fromKey}. Expected valid YYYYMM integer.`);
  }
  if (!isValidMonthKey(toKey)) {
    throw new Error(`Invalid toKey: ${toKey}. Expected valid YYYYMM integer.`);
  }
  if (fromKey > toKey) {
    throw new Error(
      `Start month key (${fromKey}) cannot be greater than end month key (${toKey}).`,
    );
  }

  const result: number[] = [];
  let current = monthKeyToComponents(fromKey);
  const target = monthKeyToComponents(toKey);

  while (
    current.year < target.year ||
    (current.year === target.year && current.month <= target.month)
  ) {
    result.push(componentsToMonthKey(current.year, current.month));

    if (result.length > MAX_MONTH_RANGE_COUNT) {
      throw new Error(
        `Month range exceeds the maximum allowed count of ${MAX_MONTH_RANGE_COUNT} months.`,
      );
    }

    if (current.month === 12) {
      current = { year: current.year + 1, month: 1 };
    } else {
      current = { year: current.year, month: current.month + 1 };
    }
  }

  return result;
}

/**
 * Compares two month keys. Suitable for Array.prototype.sort().
 */
export function compareMonthKeys(a: number, b: number): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
