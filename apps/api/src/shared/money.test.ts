import { describe, expect, it } from 'vitest';

import {
  calculateVariance,
  calculateVariancePercent,
  jsonStringToMinor,
  minorToDisplayString,
  minorToJsonString,
  parseMoneyInput,
  roundHalfAwayFromZero,
} from './money.js';

describe('parseMoneyInput', () => {
  it('parses whole dollar amounts', () => {
    expect(parseMoneyInput('100')).toBe(10000n);
    expect(parseMoneyInput('$100')).toBe(10000n);
    expect(parseMoneyInput(' 100 ')).toBe(10000n);
    expect(parseMoneyInput(' $100 ')).toBe(10000n);
    expect(parseMoneyInput('0')).toBe(0n);
    expect(parseMoneyInput('$0')).toBe(0n);
  });

  it('parses dollar amounts with 1 decimal digit', () => {
    expect(parseMoneyInput('100.5')).toBe(10050n);
    expect(parseMoneyInput('$100.5')).toBe(10050n);
    expect(parseMoneyInput('0.5')).toBe(50n);
  });

  it('parses dollar amounts with 2 decimal digits', () => {
    expect(parseMoneyInput('48.25')).toBe(4825n);
    expect(parseMoneyInput('$48.25')).toBe(4825n);
    expect(parseMoneyInput('0.01')).toBe(1n);
    expect(parseMoneyInput('0.00')).toBe(0n);
    expect(parseMoneyInput('5000.00')).toBe(500000n);
  });

  it('handles leading zeros properly', () => {
    expect(parseMoneyInput('007.50')).toBe(750n);
    expect(parseMoneyInput('$00100.00')).toBe(10000n);
  });

  it('rejects invalid, negative, or malformed inputs', () => {
    expect(() => parseMoneyInput('-48.25')).toThrow();
    expect(() => parseMoneyInput('-$48.25')).toThrow();
    expect(() => parseMoneyInput('48.255')).toThrow();
    expect(() => parseMoneyInput('1e2')).toThrow();
    expect(() => parseMoneyInput('NaN')).toThrow();
    expect(() => parseMoneyInput('Infinity')).toThrow();
    expect(() => parseMoneyInput('')).toThrow();
    expect(() => parseMoneyInput('$')).toThrow();
    expect(() => parseMoneyInput('abc')).toThrow();
  });

  it('rejects amounts exceeding the maximum minor bound', () => {
    expect(() => parseMoneyInput('1000000000000.00')).toThrow(/exceeds the maximum/);
  });
});

describe('minorToDisplayString', () => {
  it('converts positive BigInt cents to decimal string with 2 decimals', () => {
    expect(minorToDisplayString(4825n)).toBe('48.25');
    expect(minorToDisplayString(500000n)).toBe('5000.00');
    expect(minorToDisplayString(1n)).toBe('0.01');
    expect(minorToDisplayString(10n)).toBe('0.10');
    expect(minorToDisplayString(0n)).toBe('0.00');
  });

  it('converts negative BigInt cents to decimal string with negative sign', () => {
    expect(minorToDisplayString(-4825n)).toBe('-48.25');
    expect(minorToDisplayString(-1n)).toBe('-0.01');
    expect(minorToDisplayString(-20000n)).toBe('-200.00');
  });
});

describe('minorToJsonString & jsonStringToMinor', () => {
  it('serializes BigInt to base-10 string', () => {
    expect(minorToJsonString(4825n)).toBe('4825');
    expect(minorToJsonString(0n)).toBe('0');
    expect(minorToJsonString(-200n)).toBe('-200');
  });

  it('parses base-10 string back to BigInt', () => {
    expect(jsonStringToMinor('4825')).toBe(4825n);
    expect(jsonStringToMinor('0')).toBe(0n);
    expect(jsonStringToMinor('-200')).toBe(-200n);
  });

  it('rejects invalid JSON minor strings', () => {
    expect(() => jsonStringToMinor('48.25')).toThrow();
    expect(() => jsonStringToMinor('abc')).toThrow();
    expect(() => jsonStringToMinor('')).toThrow();
  });
});

describe('calculateVariance', () => {
  it('calculates actual minus plan', () => {
    expect(calculateVariance(7000n, 5000n)).toBe(2000n); // Over plan
    expect(calculateVariance(3000n, 5000n)).toBe(-2000n); // Under plan
    expect(calculateVariance(5000n, 5000n)).toBe(0n); // On plan
    expect(calculateVariance(1000n, 0n)).toBe(1000n); // Unbudgeted spend
  });
});

describe('roundHalfAwayFromZero', () => {
  it('rounds exact halves away from zero', () => {
    expect(roundHalfAwayFromZero(5n, 2n)).toBe(3n); // +2.5 -> +3
    expect(roundHalfAwayFromZero(-5n, 2n)).toBe(-3n); // -2.5 -> -3
    expect(roundHalfAwayFromZero(1n, 2n)).toBe(1n); // +0.5 -> +1
    expect(roundHalfAwayFromZero(-1n, 2n)).toBe(-1n); // -0.5 -> -1
  });

  it('rounds numbers below half towards zero', () => {
    expect(roundHalfAwayFromZero(1n, 4n)).toBe(0n); // +0.25 -> 0
    expect(roundHalfAwayFromZero(-1n, 4n)).toBe(0n); // -0.25 -> 0
  });

  it('rounds numbers above half away from zero', () => {
    expect(roundHalfAwayFromZero(3n, 4n)).toBe(1n); // +0.75 -> 1
    expect(roundHalfAwayFromZero(-3n, 4n)).toBe(-1n); // -0.75 -> -1
  });

  it('handles exact integer division without rounding', () => {
    expect(roundHalfAwayFromZero(10n, 2n)).toBe(5n);
    expect(roundHalfAwayFromZero(-10n, 2n)).toBe(-5n);
    expect(roundHalfAwayFromZero(0n, 5n)).toBe(0n);
  });

  it('throws on non-positive denominator', () => {
    expect(() => roundHalfAwayFromZero(5n, 0n)).toThrow();
    expect(() => roundHalfAwayFromZero(5n, -2n)).toThrow();
  });
});

describe('calculateVariancePercent', () => {
  it('returns null when plan is zero', () => {
    expect(calculateVariancePercent(2000n, 0n)).toBeNull();
    expect(calculateVariancePercent(0n, 0n)).toBeNull();
  });

  it('calculates positive variance percentage (over plan)', () => {
    // Plan: $50.00 (5000), Actual: $70.00 (7000) -> Variance: +2000 (+40.00%)
    expect(calculateVariancePercent(2000n, 5000n)).toBe('40.00');
    // Plan: $100.00 (10000), Variance: +250 (+2.50%)
    expect(calculateVariancePercent(250n, 10000n)).toBe('2.50');
  });

  it('calculates negative variance percentage (under plan)', () => {
    // Plan: $5000.00 (500000), Variance: -$200.00 (-20000) -> -4.00%
    expect(calculateVariancePercent(-20000n, 500000n)).toBe('-4.00');
    // Plan: $100.00 (10000), Variance: -333 (-3.33%)
    expect(calculateVariancePercent(-333n, 10000n)).toBe('-3.33');
  });

  it('calculates on-plan (0.00%)', () => {
    expect(calculateVariancePercent(0n, 5000n)).toBe('0.00');
  });

  it('handles rounding edge cases with half-away-from-zero', () => {
    // 1 / 300 = 0.003333...% -> scaled = 10000 / 300 = 33.33... -> 33 -> 0.33%
    expect(calculateVariancePercent(1n, 300n)).toBe('0.33');
  });
});
