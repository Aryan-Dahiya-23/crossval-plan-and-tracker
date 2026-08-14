import { MAX_MONEY_MINOR_BIGINT, MAX_MONEY_MINOR_STRING } from '@crossval/contracts';

/**
 * Pure integer-cent money arithmetic and formatting utilities.
 *
 * All functions operate on BigInt minor units (integer cents).
 * Floating-point arithmetic (parseFloat, Math.round, etc.) is strictly forbidden
 * to guarantee financial precision and avoid IEEE-754 rounding inaccuracies.
 */

const MONEY_INPUT_REGEX = /^\s*\$?\s*(\d+)(?:\.(\d{1,2}))?\s*$/;

/**
 * Parses user currency input string (e.g. "48.25", "$48.25", "100", "0.5") into integer cents (BigInt).
 * Throws an Error if the input is malformed, negative, or exceeds the maximum supported amount.
 */
export function parseMoneyInput(input: string): bigint {
  if (typeof input !== 'string') {
    throw new Error('Money input must be a string.');
  }

  const match = MONEY_INPUT_REGEX.exec(input);
  if (!match) {
    throw new Error(
      'Invalid money format. Must be a non-negative amount with at most two decimal places (e.g. "48.25" or "$48.25").',
    );
  }

  const integerPartStr = match[1] ?? '0';
  const fractionalPartStr = match[2] ?? '';

  const cleanIntegerStr = integerPartStr.replace(/^0+(?=\d)/, '');
  const paddedFractionalStr = fractionalPartStr.padEnd(2, '0');

  const minorString = `${cleanIntegerStr}${paddedFractionalStr}`;
  const minorBigInt = BigInt(minorString);

  if (minorBigInt > MAX_MONEY_MINOR_BIGINT) {
    throw new Error(
      `Amount exceeds the maximum allowed value (${MAX_MONEY_MINOR_STRING} minor units).`,
    );
  }

  return minorBigInt;
}

/**
 * Converts BigInt minor units into a standard decimal currency string with 2 decimal places (e.g. 4825n -> "48.25").
 * Handles negative values (e.g. for variances: -4825n -> "-48.25").
 */
export function minorToDisplayString(minor: bigint): string {
  const isNegative = minor < 0n;
  const absMinor = isNegative ? -minor : minor;

  const dollars = absMinor / 100n;
  const cents = absMinor % 100n;

  const formattedCents = cents.toString().padStart(2, '0');
  const sign = isNegative ? '-' : '';

  return `${sign}${dollars.toString()}.${formattedCents}`;
}

/**
 * Converts BigInt minor units to base-10 string for JSON transport (e.g. 4825n -> "4825").
 */
export function minorToJsonString(minor: bigint): string {
  return minor.toString(10);
}

/**
 * Parses a base-10 integer string from JSON into BigInt minor units.
 */
export function jsonStringToMinor(s: string): bigint {
  if (!/^-?\d+$/.test(s)) {
    throw new Error('Invalid minor currency string. Must be an integer string.');
  }
  return BigInt(s);
}

/**
 * Calculates financial variance: Actual - Plan.
 * Positive = Over plan (adverse expense).
 * Negative = Under plan (favorable expense).
 */
export function calculateVariance(actualMinor: bigint, planMinor: bigint): bigint {
  return actualMinor - planMinor;
}

/**
 * Rounds numerator / denominator using half-away-from-zero rounding.
 * Requires denominator > 0n.
 */
export function roundHalfAwayFromZero(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new Error('Denominator must be strictly positive.');
  }

  const isNegative = numerator < 0n;
  const absNumerator = isNegative ? -numerator : numerator;

  let quotient = absNumerator / denominator;
  const remainder = absNumerator % denominator;

  if (remainder * 2n >= denominator) {
    quotient += 1n;
  }

  return isNegative ? -quotient : quotient;
}

/**
 * Calculates variance percentage: ((Actual - Plan) / Plan) * 100.
 *
 * Rules:
 * - If planMinor is 0n: returns null (division by zero is undefined).
 * - If planMinor > 0n: calculates percentage rounded to two decimal places
 *   using half-away-from-zero rounding without floating-point arithmetic.
 *   Returns a formatted decimal string (e.g. "40.00", "-4.00", "0.00").
 */
export function calculateVariancePercent(varianceMinor: bigint, planMinor: bigint): string | null {
  if (planMinor === 0n) {
    return null;
  }

  if (planMinor < 0n) {
    throw new Error('Plan amount cannot be negative.');
  }

  // Multiply by 10000n to compute hundredths of a percent:
  // (varianceMinor / planMinor) * 100 * 100 = (varianceMinor * 10000) / planMinor
  const scaledNumerator = varianceMinor * 10_000n;
  const percentageHundredths = roundHalfAwayFromZero(scaledNumerator, planMinor);

  const isNegative = percentageHundredths < 0n;
  const absHundredths = isNegative ? -percentageHundredths : percentageHundredths;

  const whole = absHundredths / 100n;
  const fraction = absHundredths % 100n;

  const sign = isNegative ? '-' : '';
  const fractionStr = fraction.toString().padStart(2, '0');

  return `${sign}${whole.toString()}.${fractionStr}`;
}
