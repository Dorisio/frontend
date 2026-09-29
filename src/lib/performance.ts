import { addMonitoringBreadcrumb, recordPerformanceMetric } from './monitoring';

export type CoreWebVitalName = 'LCP' | 'CLS' | 'INP' | 'FID' | 'FCP' | 'TTFB';
export interface PerformanceMetric { name: CoreWebVitalName; value: number; rating: 'good' | 'needs-improvement' | 'poor'; navigationType?: string; }

const rating = (name: CoreWebVitalName, value: number): PerformanceMetric['rating'] => {
  const limits: Record<CoreWebVitalName, [number, number]> = { LCP: [2500, 4000], CLS: [0.1, 0.25], INP: [200, 500], FID: [100, 300], FCP: [1800, 3000], TTFB: [800, 1800] };
  const [good, poor] = limits[name]; return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
};

export function reportMetric(name: CoreWebVitalName, value: number): PerformanceMetric {
  const metric = { name, value: Math.round(value * 1000) / 1000, rating: rating(name, value), navigationType: performance.getEntriesByType('navigation')[0]?.entryType };
  recordPerformanceMetric(metric.name, metric.value, metric.rating); return metric;
}

export function initPerformanceMonitoring(): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return () => undefined;
  const observers: PerformanceObserver[] = [];
  const observe = (type: string, callback: (entry: PerformanceEntry) => void) => { try { const observer = new PerformanceObserver((list) => list.getEntries().forEach(callback)); observer.observe({ type, buffered: true } as PerformanceObserverInit); observers.push(observer); } catch { /* unsupported metric */ } };
  let cls = 0; let lcp = 0; let fidReported = false;
  observe('largest-contentful-paint', (entry) => { lcp = entry.startTime; reportMetric('LCP', lcp); });
  observe('layout-shift', (entry) => { const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }; if (!shift.hadRecentInput) { cls += shift.value || 0; reportMetric('CLS', cls); } });
  observe('first-input', (entry) => { if (!fidReported) { fidReported = true; const input = entry as PerformanceEntry & { processingStart: number }; reportMetric('FID', input.processingStart - entry.startTime); } });
  observe('paint', (entry) => { if (entry.name === 'first-contentful-paint') reportMetric('FCP', entry.startTime); });
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation) reportMetric('TTFB', navigation.responseStart);
  addMonitoringBreadcrumb({ category: 'performance', message: 'Core Web Vitals monitoring initialized' });
  return () => observers.forEach((observer) => observer.disconnect());
}
