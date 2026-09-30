import { beforeEach, describe, expect, it, vi } from 'vitest';

const addMonitoringBreadcrumb = vi.hoisted(() => vi.fn());
vi.mock('@/lib/monitoring', () => ({ addMonitoringBreadcrumb }));

import { installRequestTracing } from './request-tracing';

describe('installRequestTracing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a unique request ID header and a matching monitoring breadcrumb', () => {
    const interceptors: Array<(options: { method: string; headers?: Record<string, string> }) => unknown> = [];
    installRequestTracing({
      getHttpClient: () => ({
        getInterceptors: () => ({ addRequestInterceptor: (interceptor) => interceptors.push(interceptor) }),
      }),
    });

    const first = interceptors[0]({ method: 'GET', headers: { Authorization: 'Bearer token' } }) as {
      headers: Record<string, string>;
    };
    const second = interceptors[0]({ method: 'POST' }) as { headers: Record<string, string> };

    expect(first.headers.Authorization).toBe('Bearer token');
    expect(first.headers['X-Request-ID']).toBeTruthy();
    expect(second.headers['X-Request-ID']).not.toBe(first.headers['X-Request-ID']);
    expect(addMonitoringBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
      category: 'http',
      data: { requestId: first.headers['X-Request-ID'] },
    }));
  });
});
