import { addMonitoringBreadcrumb } from '@/lib/monitoring';

type RequestTracingClient = {
  getHttpClient: () => {
    getInterceptors: () => {
      addRequestInterceptor: (
        interceptor: (options: { method: string; headers?: Record<string, string> }) => {
          method: string;
          headers: Record<string, string>;
        }
      ) => void;
    };
  };
};

/** Adds a per-request correlation ID to every request sent through the SDK. */
export function installRequestTracing(client: RequestTracingClient): void {
  client.getHttpClient().getInterceptors().addRequestInterceptor((options) => {
    const requestId = globalThis.crypto?.randomUUID?.() ?? createFallbackId();
    const headers = { ...options.headers, 'X-Request-ID': requestId };

    addMonitoringBreadcrumb({
      category: 'http',
      message: `${options.method.toUpperCase()} request started`,
      data: { requestId },
    });

    return { ...options, headers };
  });
}

function createFallbackId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
