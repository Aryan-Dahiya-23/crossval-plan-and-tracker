import { apiErrorResponseSchema, healthResponseSchema } from '@crossval/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from './api-client';
import { ApiClientError } from './api-error';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('uses the API proxy, includes credentials, and validates successful JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ service: 'api', status: 'ok' }, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/health/live', { schema: healthResponseSchema })).resolves.toEqual({
      service: 'api',
      status: 'ok',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/health/live',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
  });

  it('parses the canonical structured API error', async () => {
    const payload = {
      error: {
        code: 'PERIOD_LOCKED',
        message: 'January 2026 is locked.',
        details: { month: '2026-01' },
        requestId: 'request-123',
      },
    };
    expect(apiErrorResponseSchema.safeParse(payload).success).toBe(true);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload, { status: 409 })));

    const request = apiRequest('/plans', { schema: healthResponseSchema });
    await expect(request).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 409,
      code: 'PERIOD_LOCKED',
      requestId: 'request-123',
      details: { month: '2026-01' },
    } satisfies Partial<ApiClientError>);
  });

  it('returns undefined for a successful 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('rejects a successful response that does not match its contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ service: 'web', status: 'ok' }, { status: 200 })),
    );

    await expect(
      apiRequest('/health/live', { schema: healthResponseSchema }),
    ).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'INTERNAL_ERROR',
      status: 200,
    });
  });
});
