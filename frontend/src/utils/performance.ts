/**
 * Performance monitoring utilities
 */

interface PerformanceMetrics {
  operation: string;
  duration: number;
  promptLength: number;
  timestamp: number;
}

const metrics: PerformanceMetrics[] = [];
const MAX_METRICS = 100;
const SLOW_THRESHOLD_MS = 300;

/**
 * Measure the execution time of a function
 */
export function measurePerformance<T>(
  operation: string,
  fn: () => T,
  promptLength: number = 0
): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  // Store metric
  metrics.push({
    operation,
    duration,
    promptLength,
    timestamp: Date.now(),
  });

  // Keep only last MAX_METRICS entries
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }

  // Log in development if slow
  if (import.meta.env.DEV && duration > SLOW_THRESHOLD_MS) {
    console.warn(
      `⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms (prompt length: ${promptLength})`
    );
  } else if (import.meta.env.DEV) {
    console.log(
      `✓ ${operation} completed in ${duration.toFixed(2)}ms (prompt length: ${promptLength})`
    );
  }

  return result;
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(operation?: string) {
  const filtered = operation
    ? metrics.filter((m) => m.operation === operation)
    : metrics;

  if (filtered.length === 0) {
    return null;
  }

  const durations = filtered.map((m) => m.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  return {
    count: filtered.length,
    avg: avg.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    operations: operation ? undefined : [...new Set(metrics.map((m) => m.operation))],
  };
}

/**
 * Clear all metrics
 */
export function clearMetrics() {
  metrics.length = 0;
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary() {
  if (!import.meta.env.DEV) return;

  const operations = [...new Set(metrics.map((m) => m.operation))];
  console.group('📊 Performance Summary');
  operations.forEach((op) => {
    const stats = getPerformanceStats(op);
    if (stats) {
      console.log(`${op}: avg=${stats.avg}ms, min=${stats.min}ms, max=${stats.max}ms (n=${stats.count})`);
    }
  });
  console.groupEnd();
}
