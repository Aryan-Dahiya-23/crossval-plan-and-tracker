import type { Connection } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { assertSafeEnvironmentForIndexSync, assertTestDatabase } from './guards.js';

describe('database guards', () => {
  describe('assertTestDatabase', () => {
    it('accepts databases containing "test"', () => {
      const mockConn = {
        name: 'crossval_test_db',
        db: { databaseName: 'crossval_test_db' },
      } as unknown as Connection;

      expect(() => assertTestDatabase(mockConn)).not.toThrow();
    });

    it('accepts databases prefixed with "cv_test_"', () => {
      const mockConn = {
        name: 'cv_test_12345',
        db: { databaseName: 'cv_test_12345' },
      } as unknown as Connection;

      expect(() => assertTestDatabase(mockConn)).not.toThrow();
    });

    it('rejects production database names', () => {
      const mockConn = {
        name: 'crossval_tracker_prod',
        db: { databaseName: 'crossval_tracker_prod' },
      } as unknown as Connection;

      expect(() => assertTestDatabase(mockConn)).toThrow(/Dangerous database operation blocked/);
    });

    it('rejects general non-test names', () => {
      const mockConn = {
        name: 'crossval_tracker',
        db: { databaseName: 'crossval_tracker' },
      } as unknown as Connection;

      expect(() => assertTestDatabase(mockConn)).toThrow(/Dangerous database operation blocked/);
    });
  });

  describe('assertSafeEnvironmentForIndexSync', () => {
    it('allows non-production environments', () => {
      expect(() => assertSafeEnvironmentForIndexSync('development')).not.toThrow();
      expect(() => assertSafeEnvironmentForIndexSync('test')).not.toThrow();
      expect(() => assertSafeEnvironmentForIndexSync(undefined)).not.toThrow();
    });

    it('blocks production environment', () => {
      expect(() => assertSafeEnvironmentForIndexSync('production')).toThrow(
        /forbidden in production/,
      );
    });
  });
});
