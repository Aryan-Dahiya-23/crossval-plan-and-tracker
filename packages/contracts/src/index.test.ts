import { describe, expect, it } from 'vitest';

import {
  actualDtoSchema,
  actualPaginationMetaSchema,
  actualParamsSchema,
  actualResponseSchema,
  actualsResponseSchema,
  apiErrorResponseSchema,
  authResponseSchema,
  batchPlanParamsSchema,
  batchPlanRequestSchema,
  categoriesResponseSchema,
  categoryDtoSchema,
  categoryParamsSchema,
  categoryResponseSchema,
  createActualRequestSchema,
  createCategoryRequestSchema,
  deletePlanParamsSchema,
  errorCodeSchema,
  financialPeriodDtoSchema,
  financialPeriodResponseSchema,
  financialPeriodsResponseSchema,
  financialPeriodStatusSchema,
  getReportQuerySchema,
  healthResponseSchema,
  listActualsQuerySchema,
  listCategoriesQuerySchema,
  listPeriodsQuerySchema,
  importActualsRequestSchema,
  importActualsResponseSchema,
  listPlansQuerySchema,
  loadDemoSampleResponseSchema,
  lockPeriodParamsSchema,
  loginRequestSchema,
  moneyInputSchema,
  moneyMinorStringSchema,
  monthRangeSchema,
  monthStringSchema,
  objectIdSchema,
  planDtoSchema,
  planResponseSchema,
  plansResponseSchema,
  positiveMoneyMinorStringSchema,
  putPlanParamsSchema,
  putPlanRequestSchema,
  readyResponseSchema,
  reportDtoSchema,
  reportResponseSchema,
  signedMoneyMinorStringSchema,
  signupRequestSchema,
  updateActualRequestSchema,
  updateCategoryRequestSchema,
  userDtoSchema,
} from './index.js';

describe('healthResponseSchema', () => {
  it('accepts the shared health response', () => {
    expect(
      healthResponseSchema.parse({
        service: 'api',
        status: 'ok',
      }),
    ).toEqual({
      service: 'api',
      status: 'ok',
    });
  });

  it('rejects an unhealthy response shape', () => {
    expect(() =>
      healthResponseSchema.parse({
        service: 'api',
        status: 'down',
      }),
    ).toThrow();
  });
});

describe('readyResponseSchema', () => {
  it('accepts ready response when database is connected', () => {
    expect(
      readyResponseSchema.parse({
        service: 'api',
        status: 'ok',
        database: 'connected',
      }),
    ).toEqual({
      service: 'api',
      status: 'ok',
      database: 'connected',
    });
  });

  it('accepts degraded ready response when database is disconnected', () => {
    expect(
      readyResponseSchema.parse({
        service: 'api',
        status: 'degraded',
        database: 'disconnected',
      }),
    ).toEqual({
      service: 'api',
      status: 'degraded',
      database: 'disconnected',
    });
  });
});

describe('monthStringSchema', () => {
  it('accepts valid YYYY-MM strings', () => {
    expect(monthStringSchema.parse('2026-01')).toBe('2026-01');
    expect(monthStringSchema.parse('2026-12')).toBe('2026-12');
  });

  it('rejects invalid month numbers', () => {
    expect(() => monthStringSchema.parse('2026-00')).toThrow();
    expect(() => monthStringSchema.parse('2026-13')).toThrow();
    expect(() => monthStringSchema.parse('2026-1')).toThrow();
    expect(() => monthStringSchema.parse('2026/01')).toThrow();
    expect(() => monthStringSchema.parse('202601')).toThrow();
    expect(() => monthStringSchema.parse('')).toThrow();
  });
});

describe('monthRangeSchema', () => {
  it('accepts valid inclusive ranges where from <= to', () => {
    expect(monthRangeSchema.parse({ from: '2026-01', to: '2026-03' })).toEqual({
      from: '2026-01',
      to: '2026-03',
    });
    expect(monthRangeSchema.parse({ from: '2026-05', to: '2026-05' })).toEqual({
      from: '2026-05',
      to: '2026-05',
    });
  });

  it('rejects inverted ranges where from > to', () => {
    expect(() => monthRangeSchema.parse({ from: '2026-05', to: '2026-01' })).toThrow();
  });
});

describe('moneyMinorStringSchema', () => {
  it('accepts valid non-negative integer strings', () => {
    expect(moneyMinorStringSchema.parse('0')).toBe('0');
    expect(moneyMinorStringSchema.parse('4825')).toBe('4825');
    expect(moneyMinorStringSchema.parse('99999999999999')).toBe('99999999999999');
  });

  it('rejects negative, decimal, or non-numeric strings', () => {
    expect(() => moneyMinorStringSchema.parse('-100')).toThrow();
    expect(() => moneyMinorStringSchema.parse('48.25')).toThrow();
    expect(() => moneyMinorStringSchema.parse('abc')).toThrow();
    expect(() => moneyMinorStringSchema.parse('')).toThrow();
  });

  it('rejects values exceeding maximum minor value', () => {
    expect(() => moneyMinorStringSchema.parse('100000000000000')).toThrow();
  });
});

describe('moneyInputSchema', () => {
  it('accepts valid decimal currency strings with optional dollar sign', () => {
    expect(moneyInputSchema.parse('48.25')).toBe('48.25');
    expect(moneyInputSchema.parse('$48.25')).toBe('$48.25');
    expect(moneyInputSchema.parse('100')).toBe('100');
    expect(moneyInputSchema.parse('$100.5')).toBe('$100.5');
    expect(moneyInputSchema.parse('0')).toBe('0');
    expect(moneyInputSchema.parse('0.00')).toBe('0.00');
  });

  it('rejects invalid currency inputs', () => {
    expect(() => moneyInputSchema.parse('-48.25')).toThrow();
    expect(() => moneyInputSchema.parse('48.255')).toThrow();
    expect(() => moneyInputSchema.parse('1e2')).toThrow();
    expect(() => moneyInputSchema.parse('NaN')).toThrow();
    expect(() => moneyInputSchema.parse('Infinity')).toThrow();
    expect(() => moneyInputSchema.parse('$')).toThrow();
  });
});

describe('errorCodeSchema & apiErrorResponseSchema', () => {
  it('validates canonical error codes', () => {
    expect(errorCodeSchema.parse('VALIDATION_ERROR')).toBe('VALIDATION_ERROR');
    expect(errorCodeSchema.parse('PERIOD_LOCKED')).toBe('PERIOD_LOCKED');
    expect(errorCodeSchema.parse('CATEGORY_ALREADY_EXISTS')).toBe('CATEGORY_ALREADY_EXISTS');
    expect(errorCodeSchema.parse('CATEGORY_ARCHIVED')).toBe('CATEGORY_ARCHIVED');
    expect(errorCodeSchema.parse('INTERNAL_ERROR')).toBe('INTERNAL_ERROR');
    expect(() => errorCodeSchema.parse('UNKNOWN_CODE')).toThrow();
  });

  it('validates structured error response shape', () => {
    const errorPayload = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request is invalid.',
        details: {
          fields: {
            amountMinor: ['Amount must be greater than zero.'],
          },
        },
        requestId: 'req_123',
      },
    };

    expect(apiErrorResponseSchema.parse(errorPayload)).toEqual(errorPayload);
  });
});

describe('auth schemas', () => {
  it('validates signup request', () => {
    expect(
      signupRequestSchema.parse({
        email: '  test@example.com  ',
        password: '123456',
      }),
    ).toEqual({
      email: 'test@example.com',
      password: '123456',
    });

    expect(() =>
      signupRequestSchema.parse({
        email: 'invalid-email',
        password: 'password123',
      }),
    ).toThrow();

    expect(() =>
      signupRequestSchema.parse({
        email: 'test@example.com',
        password: 'short', // 5 chars
      }),
    ).toThrow();
  });

  it('validates login request', () => {
    expect(
      loginRequestSchema.parse({
        email: 'test@example.com',
        password: 'p',
      }),
    ).toEqual({
      email: 'test@example.com',
      password: 'p',
    });

    expect(() =>
      loginRequestSchema.parse({
        email: 'test@example.com',
        password: '',
      }),
    ).toThrow();
  });

  it('validates userDto and authResponse', () => {
    const user = {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      createdAt: '2026-08-14T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    };

    expect(userDtoSchema.parse(user)).toEqual(user);
    expect(authResponseSchema.parse({ data: user })).toEqual({ data: user });
  });
});

describe('category schemas', () => {
  it('validates objectIdSchema and categoryParamsSchema', () => {
    const validId = '507f1f77bcf86cd799439011';
    expect(objectIdSchema.parse(validId)).toBe(validId);
    expect(categoryParamsSchema.parse({ id: validId })).toEqual({ id: validId });

    expect(() => objectIdSchema.parse('invalid-id')).toThrow();
    expect(() => objectIdSchema.parse('507f1f77bcf86cd79943901')).toThrow(); // 23 chars
  });

  it('validates createCategoryRequestSchema with trimming and optional colorKey', () => {
    expect(
      createCategoryRequestSchema.parse({
        name: '  Marketing  ',
      }),
    ).toEqual({
      name: 'Marketing',
    });

    expect(
      createCategoryRequestSchema.parse({
        name: 'Payroll',
        colorKey: 'emerald',
      }),
    ).toEqual({
      name: 'Payroll',
      colorKey: 'emerald',
    });

    expect(() => createCategoryRequestSchema.parse({ name: '' })).toThrow();
    expect(() => createCategoryRequestSchema.parse({ name: 'a'.repeat(51) })).toThrow();
  });

  it('validates updateCategoryRequestSchema with partial fields and refinement', () => {
    expect(
      updateCategoryRequestSchema.parse({
        name: 'Growth & Marketing',
      }),
    ).toEqual({
      name: 'Growth & Marketing',
    });

    expect(
      updateCategoryRequestSchema.parse({
        colorKey: 'purple',
      }),
    ).toEqual({
      colorKey: 'purple',
    });

    expect(
      updateCategoryRequestSchema.parse({
        name: 'Tools',
        colorKey: 'amber',
      }),
    ).toEqual({
      name: 'Tools',
      colorKey: 'amber',
    });

    // Empty object violates refinement requiring at least one property
    expect(() => updateCategoryRequestSchema.parse({})).toThrow();
  });

  it('validates listCategoriesQuerySchema coercion', () => {
    expect(listCategoriesQuerySchema.parse({})).toEqual({
      includeArchived: false,
    });
    expect(listCategoriesQuerySchema.parse({ includeArchived: 'true' })).toEqual({
      includeArchived: true,
    });
    expect(listCategoriesQuerySchema.parse({ includeArchived: 'false' })).toEqual({
      includeArchived: false,
    });
    expect(listCategoriesQuerySchema.parse({ includeArchived: true })).toEqual({
      includeArchived: true,
    });
  });

  it('validates categoryDto, categoryResponse, and categoriesResponse', () => {
    const category = {
      id: '507f1f77bcf86cd799439011',
      name: 'Software',
      colorKey: 'blue',
      archivedAt: null,
      createdAt: '2026-08-14T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    };

    expect(categoryDtoSchema.parse(category)).toEqual(category);
    expect(categoryResponseSchema.parse({ data: category })).toEqual({
      data: category,
    });
    expect(categoriesResponseSchema.parse({ data: [category] })).toEqual({
      data: [category],
    });
  });
});

describe('plan schemas', () => {
  const catId = '507f1f77bcf86cd799439011';

  it('validates putPlanParamsSchema and putPlanRequestSchema', () => {
    expect(
      putPlanParamsSchema.parse({
        categoryId: catId,
        month: '2026-01',
      }),
    ).toEqual({
      categoryId: catId,
      month: '2026-01',
    });

    expect(putPlanRequestSchema.parse({ amountMinor: '500000' })).toEqual({
      amountMinor: '500000',
    });
    expect(putPlanRequestSchema.parse({ amountMinor: '0' })).toEqual({
      amountMinor: '0',
    });

    expect(() => putPlanRequestSchema.parse({ amountMinor: '-500' })).toThrow();
    expect(() => putPlanRequestSchema.parse({ amountMinor: '50.00' })).toThrow();
    expect(deletePlanParamsSchema.parse({ categoryId: catId, month: '2026-05' })).toEqual({
      categoryId: catId,
      month: '2026-05',
    });
  });

  it('validates listPlansQuerySchema', () => {
    expect(
      listPlansQuerySchema.parse({
        from: '2026-01',
        to: '2026-06',
        categoryId: catId,
      }),
    ).toEqual({
      from: '2026-01',
      to: '2026-06',
      categoryId: catId,
    });

    expect(() =>
      listPlansQuerySchema.parse({
        from: '2026-06',
        to: '2026-01',
      }),
    ).toThrow();
  });

  it('validates batchPlanParamsSchema and batchPlanRequestSchema', () => {
    expect(batchPlanParamsSchema.parse({ month: '2026-03' })).toEqual({
      month: '2026-03',
    });

    const catId2 = '507f1f77bcf86cd799439012';
    const validBatch = {
      changes: [
        { categoryId: catId, amountMinor: '500000' },
        { categoryId: catId2, amountMinor: null },
      ],
    };

    expect(batchPlanRequestSchema.parse(validBatch)).toEqual(validBatch);

    // Duplicate categoryId in changes is rejected
    const duplicateBatch = {
      changes: [
        { categoryId: catId, amountMinor: '500000' },
        { categoryId: catId, amountMinor: '300000' },
      ],
    };
    expect(() => batchPlanRequestSchema.parse(duplicateBatch)).toThrow();

    // Empty changes is rejected
    expect(() => batchPlanRequestSchema.parse({ changes: [] })).toThrow();
  });

  it('validates planDto and response envelopes', () => {
    const plan = {
      id: '507f1f77bcf86cd799439013',
      categoryId: catId,
      month: '2026-01',
      amountMinor: '500000',
      createdAt: '2026-08-14T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    };

    expect(planDtoSchema.parse(plan)).toEqual(plan);
    expect(planResponseSchema.parse({ data: plan })).toEqual({ data: plan });
    expect(plansResponseSchema.parse({ data: [plan] })).toEqual({ data: [plan] });
  });
});

describe('actual contracts', () => {
  const catId = '507f1f77bcf86cd799439011';
  const actualId = '507f1f77bcf86cd799439012';

  it('validates positiveMoneyMinorStringSchema', () => {
    expect(positiveMoneyMinorStringSchema.parse('1')).toBe('1');
    expect(positiveMoneyMinorStringSchema.parse('200000')).toBe('200000');
    expect(positiveMoneyMinorStringSchema.parse('99999999999999')).toBe('99999999999999');

    // Rejects explicit zero
    expect(() => positiveMoneyMinorStringSchema.parse('0')).toThrow();
    expect(() => positiveMoneyMinorStringSchema.parse('00')).toThrow();

    // Rejects negative amounts
    expect(() => positiveMoneyMinorStringSchema.parse('-100')).toThrow();

    // Rejects decimals / malformed strings
    expect(() => positiveMoneyMinorStringSchema.parse('100.50')).toThrow();
    expect(() => positiveMoneyMinorStringSchema.parse('abc')).toThrow();
    expect(() => positiveMoneyMinorStringSchema.parse('')).toThrow();
  });

  it('validates createActualRequestSchema', () => {
    const valid = {
      categoryId: catId,
      month: '2026-01',
      amountMinor: '200000',
      note: 'Google Ads campaigns',
    };
    expect(createActualRequestSchema.parse(valid)).toEqual(valid);

    // Note is optional and nullable
    expect(
      createActualRequestSchema.parse({
        categoryId: catId,
        month: '2026-01',
        amountMinor: '200000',
        note: null,
      }),
    ).toBeDefined();

    expect(
      createActualRequestSchema.parse({
        categoryId: catId,
        month: '2026-01',
        amountMinor: '200000',
      }),
    ).toBeDefined();

    // Note over 500 characters is rejected
    expect(() =>
      createActualRequestSchema.parse({
        categoryId: catId,
        month: '2026-01',
        amountMinor: '200000',
        note: 'x'.repeat(501),
      }),
    ).toThrow();

    // Zero amount is rejected
    expect(() =>
      createActualRequestSchema.parse({
        categoryId: catId,
        month: '2026-01',
        amountMinor: '0',
      }),
    ).toThrow();
  });

  it('validates updateActualRequestSchema', () => {
    expect(updateActualRequestSchema.parse({ amountMinor: '300000' })).toEqual({
      amountMinor: '300000',
    });
    expect(updateActualRequestSchema.parse({ note: 'Updated note' })).toEqual({
      note: 'Updated note',
    });
    expect(updateActualRequestSchema.parse({ month: '2026-02' })).toEqual({
      month: '2026-02',
    });
    expect(updateActualRequestSchema.parse({ categoryId: catId })).toEqual({
      categoryId: catId,
    });

    // Empty object rejected
    expect(() => updateActualRequestSchema.parse({})).toThrow();
  });

  it('validates listActualsQuerySchema', () => {
    expect(listActualsQuerySchema.parse({})).toEqual({ limit: 20 });
    expect(listActualsQuerySchema.parse({ limit: '50' })).toEqual({ limit: 50 });
    expect(listActualsQuerySchema.parse({ month: '2026-01', categoryId: catId })).toEqual({
      month: '2026-01',
      categoryId: catId,
      limit: 20,
    });
    expect(listActualsQuerySchema.parse({ from: '2026-01', to: '2026-06' })).toEqual({
      from: '2026-01',
      to: '2026-06',
      limit: 20,
    });

    // Invalid range: from > to
    expect(() => listActualsQuerySchema.parse({ from: '2026-06', to: '2026-01' })).toThrow();

    // Only from without to
    expect(() => listActualsQuerySchema.parse({ from: '2026-01' })).toThrow();

    // Limit out of bounds
    expect(() => listActualsQuerySchema.parse({ limit: '0' })).toThrow();
    expect(() => listActualsQuerySchema.parse({ limit: '101' })).toThrow();
  });

  it('validates actualParamsSchema and actualPaginationMetaSchema', () => {
    expect(actualParamsSchema.parse({ id: actualId })).toEqual({ id: actualId });
    expect(() => actualParamsSchema.parse({ id: 'invalid-id' })).toThrow();

    expect(actualPaginationMetaSchema.parse({ nextCursor: null, hasMore: false })).toEqual({
      nextCursor: null,
      hasMore: false,
    });
  });

  it('validates importActualsRequestSchema and importActualsResponseSchema', () => {
    const validBatch = {
      rows: [
        { month: '2026-01', categoryName: 'Marketing', amountMinor: '480000', note: 'Ads' },
        { month: '2026-02', categoryName: 'Payroll', amountMinor: '2050000', note: null },
      ],
    };

    expect(importActualsRequestSchema.parse(validBatch)).toEqual(validBatch);

    // Empty rows array is rejected
    expect(() => importActualsRequestSchema.parse({ rows: [] })).toThrow();

    // Invalid month format is rejected
    expect(() =>
      importActualsRequestSchema.parse({
        rows: [{ month: '2026-13', categoryName: 'Marketing', amountMinor: '1000' }],
      }),
    ).toThrow();

    // Response envelope
    const resPayload = {
      data: {
        importedCount: 2,
        actuals: [
          {
            id: actualId,
            categoryId: catId,
            month: '2026-01',
            amountMinor: '480000',
            note: 'Ads',
            createdAt: '2026-08-15T00:00:00.000Z',
            updatedAt: '2026-08-15T00:00:00.000Z',
          },
        ],
      },
    };
    expect(importActualsResponseSchema.parse(resPayload)).toEqual(resPayload);
  });

  it('validates actualDto and response envelopes', () => {
    const actual = {
      id: actualId,
      categoryId: catId,
      month: '2026-01',
      amountMinor: '200000',
      note: 'Team lunch',
      createdAt: '2026-08-14T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    };

    expect(actualDtoSchema.parse(actual)).toEqual(actual);
    expect(actualResponseSchema.parse({ data: actual })).toEqual({ data: actual });
    expect(
      actualsResponseSchema.parse({
        data: [actual],
        meta: { nextCursor: 'opaque_cursor_string', hasMore: true },
      }),
    ).toEqual({
      data: [actual],
      meta: { nextCursor: 'opaque_cursor_string', hasMore: true },
    });
  });
});

describe('period contracts', () => {
  it('validates financialPeriodStatusSchema', () => {
    expect(financialPeriodStatusSchema.parse('OPEN')).toBe('OPEN');
    expect(financialPeriodStatusSchema.parse('LOCKED')).toBe('LOCKED');
    expect(() => financialPeriodStatusSchema.parse('CLOSED')).toThrow();
  });

  it('validates lockPeriodParamsSchema', () => {
    expect(lockPeriodParamsSchema.parse({ month: '2026-01' })).toEqual({ month: '2026-01' });
    expect(() => lockPeriodParamsSchema.parse({ month: '2026-13' })).toThrow();
    expect(() => lockPeriodParamsSchema.parse({ month: '202601' })).toThrow();
  });

  it('validates listPeriodsQuerySchema', () => {
    expect(listPeriodsQuerySchema.parse({ from: '2026-01', to: '2026-12' })).toEqual({
      from: '2026-01',
      to: '2026-12',
    });

    // Inverted range
    expect(() => listPeriodsQuerySchema.parse({ from: '2026-12', to: '2026-01' })).toThrow();
  });

  it('validates financialPeriodDto and response envelopes (including implicit open period)', () => {
    const lockedPeriod = {
      id: '507f1f77bcf86cd799439011',
      month: '2026-01',
      status: 'LOCKED',
      lockedAt: '2026-08-14T10:00:00.000Z',
      createdAt: '2026-08-14T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    };

    const implicitOpenPeriod = {
      id: null,
      month: '2026-02',
      status: 'OPEN',
      lockedAt: null,
      createdAt: null,
      updatedAt: null,
    };

    expect(financialPeriodDtoSchema.parse(lockedPeriod)).toEqual(lockedPeriod);
    expect(financialPeriodDtoSchema.parse(implicitOpenPeriod)).toEqual(implicitOpenPeriod);

    expect(financialPeriodResponseSchema.parse({ data: lockedPeriod })).toEqual({
      data: lockedPeriod,
    });
    expect(
      financialPeriodsResponseSchema.parse({ data: [lockedPeriod, implicitOpenPeriod] }),
    ).toEqual({ data: [lockedPeriod, implicitOpenPeriod] });
  });
});

describe('signedMoneyMinorStringSchema', () => {
  it('accepts positive, zero, and negative integer strings', () => {
    expect(signedMoneyMinorStringSchema.parse('0')).toBe('0');
    expect(signedMoneyMinorStringSchema.parse('50000')).toBe('50000');
    expect(signedMoneyMinorStringSchema.parse('-20000')).toBe('-20000');
    expect(() => signedMoneyMinorStringSchema.parse('12.50')).toThrow();
    expect(() => signedMoneyMinorStringSchema.parse('abc')).toThrow();
  });
});

describe('report and demo contracts', () => {
  it('validates getReportQuerySchema', () => {
    expect(getReportQuerySchema.parse({ from: '2026-01', to: '2026-06' })).toEqual({
      from: '2026-01',
      to: '2026-06',
    });

    expect(() => getReportQuerySchema.parse({ from: '2026-06', to: '2026-01' })).toThrow();
  });

  it('validates reportDto and reportResponseSchema', () => {
    const report = {
      range: { from: '2026-01', to: '2026-02' },
      summary: {
        planMinor: '5000000',
        actualMinor: '4510000',
        varianceMinor: '-490000',
        variancePercent: '-9.80',
        overPlanCategoryCount: 1,
      },
      monthlySeries: [
        {
          month: '2026-01',
          planMinor: '2500000',
          actualMinor: '2530000',
          varianceMinor: '30000',
          locked: false,
        },
        {
          month: '2026-02',
          planMinor: '2500000',
          actualMinor: '1980000',
          varianceMinor: '-520000',
          locked: false,
        },
      ],
      categories: [
        {
          category: {
            id: '507f1f77bcf86cd799439011',
            name: 'Marketing',
            colorKey: 'purple',
          },
          subtotal: {
            planMinor: '1000000',
            actualMinor: '480000',
            varianceMinor: '-520000',
            variancePercent: '-52.00',
          },
          months: [
            {
              month: '2026-01',
              hasPlan: true,
              planMinor: '500000',
              actualMinor: '480000',
              varianceMinor: '-20000',
              variancePercent: '-4.00',
              actualEntryCount: 3,
              locked: false,
            },
            {
              month: '2026-02',
              hasPlan: true,
              planMinor: '500000',
              actualMinor: '0',
              varianceMinor: '-500000',
              variancePercent: '-100.00',
              actualEntryCount: 0,
              locked: false,
            },
          ],
        },
      ],
    };

    expect(reportDtoSchema.parse(report)).toEqual(report);
    expect(reportResponseSchema.parse({ data: report })).toEqual({ data: report });
  });

  it('validates loadDemoSampleResponseSchema', () => {
    const demoRes = {
      data: {
        plansCreated: 4,
        actualsCreated: 5,
        range: { from: '2026-01', to: '2026-02' },
      },
    };

    expect(loadDemoSampleResponseSchema.parse(demoRes)).toEqual(demoRes);
  });
});
