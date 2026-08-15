import { describe, expect, it } from 'vitest';

import { formatCentsForInput, formatCentsToDollars, parseDollarsToCents } from './money-format';

describe('money-format utilities', () => {
  describe('formatCentsToDollars', () => {
    it('formats positive minor amounts to USD formatted string', () => {
      expect(formatCentsToDollars('500000')).toBe('$5,000.00');
      expect(formatCentsToDollars('2050000')).toBe('$20,500.00');
      expect(formatCentsToDollars('125')).toBe('$1.25');
      expect(formatCentsToDollars('0')).toBe('$0.00');
    });

    it('formats negative minor amounts with minus sign', () => {
      expect(formatCentsToDollars('-20000')).toBe('-$200.00');
      expect(formatCentsToDollars('-500000')).toBe('-$5,000.00');
    });

    it('handles null, undefined, or empty with fallback', () => {
      expect(formatCentsToDollars(null)).toBe('—');
      expect(formatCentsToDollars(undefined)).toBe('—');
      expect(formatCentsToDollars('')).toBe('—');
      expect(formatCentsToDollars(null, { fallback: '-' })).toBe('-');
    });
  });

  describe('formatCentsForInput', () => {
    it('formats minor cents to plain dollar string for input fields', () => {
      expect(formatCentsForInput('500000')).toBe('5000');
      expect(formatCentsForInput('500050')).toBe('5000.50');
      expect(formatCentsForInput('0')).toBe('0');
      expect(formatCentsForInput(null)).toBe('');
    });
  });

  describe('parseDollarsToCents', () => {
    it('parses user dollar inputs into minor unit strings', () => {
      expect(parseDollarsToCents('5000')).toBe('500000');
      expect(parseDollarsToCents('$5,000.00')).toBe('500000');
      expect(parseDollarsToCents('5000.50')).toBe('500050');
      expect(parseDollarsToCents('5000.5')).toBe('500050');
      expect(parseDollarsToCents('0')).toBe('0');
      expect(parseDollarsToCents('$0.00')).toBe('0');
    });

    it('returns null for blank or invalid inputs', () => {
      expect(parseDollarsToCents('')).toBeNull();
      expect(parseDollarsToCents('   ')).toBeNull();
      expect(parseDollarsToCents(null)).toBeNull();
      expect(parseDollarsToCents('abc')).toBeNull();
    });
  });
});
