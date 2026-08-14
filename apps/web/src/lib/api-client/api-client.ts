import { apiErrorResponseSchema } from '@crossval/contracts';
import type { ZodType } from 'zod';

import { ApiClientError } from './api-error';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions<T> = Omit<RequestInit, 'body' | 'credentials' | 'method'> & {
  method?: ApiMethod;
  body?: unknown;
  schema?: ZodType<T>;
};

const API_BASE_PATH = '/api/v1';

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_PATH}${normalizedPath}`;
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) return undefined;

  try {
    return await response.json();
  } catch (cause) {
    throw new ApiClientError('The server returned an unreadable response.', {
      status: response.status,
      code: 'INTERNAL_ERROR',
      cause,
    });
  }
}

function createResponseError(response: Response, payload: unknown) {
  const parsed = apiErrorResponseSchema.safeParse(payload);
  if (parsed.success) {
    const { code, details, message, requestId } = parsed.data.error;
    return new ApiClientError(message, {
      status: response.status,
      code,
      requestId,
      ...(details ? { details } : {}),
    });
  }

  const requestId = response.headers.get('x-request-id');
  return new ApiClientError('The request could not be completed.', {
    status: response.status,
    code: 'INTERNAL_ERROR',
    ...(requestId ? { requestId } : {}),
  });
}

export async function apiRequest<T = void>(
  path: string,
  { body, headers, method = 'GET', schema, ...init }: ApiRequestOptions<T> = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);

  if (body !== undefined) requestHeaders.set('content-type', 'application/json');
  requestHeaders.set('accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      ...init,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: 'include',
      headers: requestHeaders,
      method,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;

    throw new ApiClientError('Unable to reach the server. Check your connection and try again.', {
      status: 0,
      code: 'INTERNAL_ERROR',
      cause,
    });
  }

  if (response.status === 204) return undefined as T;

  const payload = await parseJson(response);
  if (!response.ok) throw createResponseError(response, payload);

  if (!schema) return payload as T;

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const requestId = response.headers.get('x-request-id');
    throw new ApiClientError('The server returned an unexpected response.', {
      status: response.status,
      code: 'INTERNAL_ERROR',
      ...(requestId ? { requestId } : {}),
      cause: parsed.error,
    });
  }

  return parsed.data;
}

export const apiClient = {
  get<T>(path: string, schema: ZodType<T>, init?: Omit<ApiRequestOptions<T>, 'method' | 'schema'>) {
    return apiRequest(path, { ...init, method: 'GET', schema });
  },
  post<T>(
    path: string,
    body: unknown,
    schema: ZodType<T>,
    init?: Omit<ApiRequestOptions<T>, 'body' | 'method' | 'schema'>,
  ) {
    return apiRequest(path, { ...init, body, method: 'POST', schema });
  },
  patch<T>(
    path: string,
    body: unknown,
    schema: ZodType<T>,
    init?: Omit<ApiRequestOptions<T>, 'body' | 'method' | 'schema'>,
  ) {
    return apiRequest(path, { ...init, body, method: 'PATCH', schema });
  },
  delete(path: string, init?: Omit<ApiRequestOptions<void>, 'method'>) {
    return apiRequest(path, { ...init, method: 'DELETE' });
  },
};
